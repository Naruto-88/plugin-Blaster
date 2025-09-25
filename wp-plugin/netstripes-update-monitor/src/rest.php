<?php
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('ns-monitor/v1', '/ping', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () { return new WP_REST_Response(['ok' => true], 200); }
    ]);

    register_rest_route('ns-monitor/v1', '/status', [
        'methods' => 'GET',
        'permission_callback' => 'nsm_require_auth',
        'callback' => 'nsm_status_handler'
    ]);

    register_rest_route('ns-monitor/v1', '/webhook', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'nsm_webhook_handler'
    ]);

    // Remote update endpoints (HMAC-protected using plugin secret)
    register_rest_route('ns-monitor/v1', '/update/core', [
        'methods' => 'POST',
        'permission_callback' => 'nsm_verify_hmac_or_auth',
        'callback' => 'nsm_update_core_handler'
    ]);
    register_rest_route('ns-monitor/v1', '/update/plugin', [
        'methods' => 'POST',
        'permission_callback' => 'nsm_verify_hmac_or_auth',
        'callback' => 'nsm_update_plugin_handler',
        'args' => [
            'slug' => [ 'required' => true, 'type' => 'string' ],
        ]
    ]);
    register_rest_route('ns-monitor/v1', '/update/all', [
        'methods' => 'POST',
        'permission_callback' => 'nsm_verify_hmac_or_auth',
        'callback' => 'nsm_update_all_handler'
    ]);
    register_rest_route('ns-monitor/v1', '/update/test', [
        'methods' => 'GET,POST',
        'permission_callback' => 'nsm_verify_hmac_or_auth',
        'callback' => 'nsm_update_test_handler'
    ]);
});

function nsm_require_auth() {
    if (!current_user_can('manage_options')) return false;
    $opts = nsm_get_options();
    if ($opts['auth_mode'] === 'bearer') {
        $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_AUTHORIZATION'])) : '';
        if (str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7);
            // In real usage validate token; for demo require logged-in admin.
            return is_user_logged_in();
        }
        return false;
    }
    // app_password mode: rely on Basic auth / Application Password support in WP
    return true;
}

function nsm_status_handler(WP_REST_Request $request) {
    if (!current_user_can('manage_options')) return new WP_Error('forbidden', 'Forbidden', ['status' => 403]);

    require_once ABSPATH . 'wp-admin/includes/plugin.php';

    $core_update = get_site_transient('update_core');
    $plugins_update = get_site_transient('update_plugins');
    $plugins = get_plugins();

    $core_current = get_bloginfo('version');
    $core_latest = $core_current;
    $core_update_available = false;
    $core_security = false;
    if (!empty($core_update->updates) && is_array($core_update->updates)) {
        foreach ($core_update->updates as $u) {
            if (isset($u->response) && ($u->response === 'upgrade' || $u->response === 'autoupdate')) {
                $core_update_available = true;
                $core_latest = $u->version;
                $core_security = !empty($u->security);
                break;
            }
        }
    }

    $pluginStatuses = [];
    foreach ($plugins as $file => $data) {
        $slug = dirname($file);
        $current = $data['Version'] ?? '';
        $latest = $current;
        $update = false;
        $security = false;
        $hasChangelog = false;
        $changelogUrl = '';
        if (!empty($plugins_update->response[$file])) {
            $upd = $plugins_update->response[$file];
            $latest = $upd->new_version ?? $current;
            $update = version_compare($latest, $current, '>');
            $changelogUrl = $upd->url ?? '';
            $hasChangelog = !empty($changelogUrl);
        }
        $pluginStatuses[] = [
            'slug' => sanitize_text_field($slug),
            'name' => sanitize_text_field($data['Name'] ?? $slug),
            'currentVersion' => sanitize_text_field($current),
            'latestVersion' => sanitize_text_field($latest),
            'updateAvailable' => (bool)$update,
            'security' => (bool)$security,
            'hasChangelog' => (bool)$hasChangelog,
            'changelogUrl' => esc_url_raw($changelogUrl)
        ];
    }

    $resp = [
        'site' => [ 'url' => esc_url_raw(home_url()), 'name' => sanitize_text_field(get_bloginfo('name')) ],
        'core' => [
            'currentVersion' => sanitize_text_field($core_current),
            'latestVersion' => sanitize_text_field($core_latest),
            'updateAvailable' => (bool)$core_update_available,
            'security' => (bool)$core_security
        ],
        'plugins' => array_values($pluginStatuses)
    ];
    return new WP_REST_Response($resp, 200);
}

function nsm_webhook_handler(WP_REST_Request $request) {
    $opts = nsm_get_options();
    if (!$opts['webhook_enabled']) return new WP_Error('disabled', 'Webhook disabled', ['status' => 403]);
    $secret = $opts['secret'];
    $body = $request->get_body();
    $calc = base64_encode(hash_hmac('sha256', $body, $secret, true));
    $sig = $request->get_header('x-nsm-signature');
    if (!$sig || !hash_equals($calc, $sig)) return new WP_Error('forbidden', 'Invalid signature', ['status' => 401]);
    return new WP_REST_Response(['ok' => true], 200);
}


function nsm_verify_hmac(WP_REST_Request $request) {
    $opts = nsm_get_options();
    $secret = $opts['secret'];
    if (!$secret) return false;
    $sig = $request->get_header('x-nsm-signature');
    $body = $request->get_body();
    $calc = base64_encode(hash_hmac('sha256', $body, $secret, true));
    return ($sig && hash_equals($calc, $sig));
}

function nsm_verify_hmac_or_auth(WP_REST_Request $request) {
    // Allow either HMAC with secret or authenticated admin (App Password/Bearer)
    if (nsm_verify_hmac($request)) return true;
    return nsm_require_auth();
}

function nsm_update_core_handler(WP_REST_Request $request) {
    if (!(nsm_verify_hmac($request) || current_user_can('update_core'))) return new WP_Error('forbidden', 'Forbidden', ['status' => 403]);
    require_once ABSPATH . 'wp-admin/includes/update.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    require_once ABSPATH . 'wp-admin/includes/class-core-upgrader.php';
    wp_version_check();
    $updates = get_core_updates();
    if (empty($updates) || !is_array($updates)) {
        return new WP_REST_Response(['ok' => false, 'message' => 'No core updates available'], 200);
    }
    $offer = null;
    foreach ($updates as $u) {
        if (!empty($u) && isset($u->response) && ($u->response === 'upgrade' || $u->response === 'autoupdate')) { $offer = $u; break; }
    }
    if (!$offer) return new WP_REST_Response(['ok' => false, 'message' => 'No applicable core update'], 200);
    $upgrader = new Core_Upgrader();
    $result = $upgrader->upgrade($offer);
    if (is_wp_error($result)) return $result;
    return new WP_REST_Response(['ok' => true, 'updated' => (bool)$result], 200);
}

function nsm_update_plugin_handler(WP_REST_Request $request) {
    if (!(nsm_verify_hmac($request) || current_user_can('update_plugins'))) return new WP_Error('forbidden', 'Forbidden', ['status' => 403]);
    $slug = sanitize_text_field($request->get_param('slug'));
    if (!$slug) return new WP_Error('bad_request', 'Missing slug', ['status' => 400]);
    require_once ABSPATH . 'wp-admin/includes/update.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    wp_update_plugins();

    // Prefer matching via update response keys (more accurate)
    $plugins_update = get_site_transient('update_plugins');
    $file = null;
    if (!empty($plugins_update->response) && is_array($plugins_update->response)) {
        foreach ($plugins_update->response as $plugin_file => $upd) {
            if (dirname($plugin_file) === $slug || $plugin_file === $slug) { $file = $plugin_file; break; }
        }
    }
    // Fallback: scan all installed plugins
    if (!$file) {
        $plugins = get_plugins();
        foreach ($plugins as $plugin_file => $data) {
            $basename = dirname($plugin_file);
            if ($basename === $slug || $plugin_file === $slug) { $file = $plugin_file; break; }
        }
    }
    if (!$file) return new WP_Error('not_found', 'Plugin not found', ['status' => 404]);
    $skin = new Automatic_Upgrader_Skin();
    $upgrader = new Plugin_Upgrader($skin);
    ob_start();
    $result = $upgrader->upgrade($file);
    $log = ob_get_clean();
    if (is_wp_error($result)) return $result;
    // Clear caches to reflect changes
    if (function_exists('wp_clean_plugins_cache')) wp_clean_plugins_cache(true);
    wp_update_plugins();
    return new WP_REST_Response([
        'ok' => true,
        'updated' => (bool)$result,
        'file' => $file,
        'result' => $result,
        'log' => $log,
    ], 200);
}

function nsm_update_all_handler(WP_REST_Request $request) {
    $result = [ 'core' => false, 'plugins' => 0 ];
    // Core
    if (nsm_verify_hmac($request) || current_user_can('update_core')) {
        require_once ABSPATH . 'wp-admin/includes/update.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/class-core-upgrader.php';
        wp_version_check();
        $updates = get_core_updates();
        if (!empty($updates) && is_array($updates)) {
            foreach ($updates as $u) {
                if (isset($u->response) && ($u->response === 'upgrade' || $u->response === 'autoupdate')) {
                    $upgrader = new Core_Upgrader();
                    $r = $upgrader->upgrade($u);
                    if (!is_wp_error($r)) $result['core'] = true;
                    break;
                }
            }
        }
    }
    // Plugins
    if (nsm_verify_hmac($request) || current_user_can('update_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/update.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        wp_update_plugins();
        $plugins_update = get_site_transient('update_plugins');
        if (!empty($plugins_update->response) && is_array($plugins_update->response)) {
            $files = array_keys($plugins_update->response);
            if (!empty($files)) {
                $skin = new Automatic_Upgrader_Skin();
                $upgrader = new Plugin_Upgrader($skin);
                ob_start();
                if (method_exists($upgrader, 'bulk_upgrade')) {
                    $r = $upgrader->bulk_upgrade($files);
                } else {
                    $r = [];
                    foreach ($files as $file) {
                        $rr = $upgrader->upgrade($file);
                        $r[$file] = $rr;
                    }
                }
                $log = ob_get_clean();
                $result['plugins'] = count($files);
                if (function_exists('wp_clean_plugins_cache')) wp_clean_plugins_cache(true);
                wp_update_plugins();
                $result['log'] = $log;
            }
        }
    }
    return new WP_REST_Response(['ok' => true, 'result' => $result], 200);
}

function nsm_update_test_handler(WP_REST_Request $request) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/update.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

    $version = get_bloginfo('version');
    $canCore = current_user_can('update_core');
    $canPlugins = current_user_can('update_plugins');
    $disallow = defined('DISALLOW_FILE_MODS') ? (bool)constant('DISALLOW_FILE_MODS') : false;
    $fs_method = function_exists('get_filesystem_method') ? get_filesystem_method() : 'unknown';

    // Determine if filesystem credentials likely required
    $needsCreds = false;
    if (!$disallow && function_exists('get_filesystem_method') && $fs_method !== 'direct') {
        // If not direct, credentials may be required
        $needsCreds = true;
    }

    $pluginsWritable = is_writable(WP_PLUGIN_DIR);
    $contentWritable = is_writable(WP_CONTENT_DIR);

    // Count plugins with pending updates
    wp_update_plugins();
    $plugins_update = get_site_transient('update_plugins');
    $pluginCandidates = [];
    if (!empty($plugins_update->response) && is_array($plugins_update->response)) {
        $pluginCandidates = array_keys($plugins_update->response);
    }

    $resp = [
        'ok' => true,
        'user' => [ 'canUpdateCore' => (bool)$canCore, 'canUpdatePlugins' => (bool)$canPlugins ],
        'wordpress' => [
            'version' => $version,
            'disallowFileMods' => $disallow,
            'fsMethod' => $fs_method,
            'needsFilesystemCreds' => $needsCreds,
        ],
        'paths' => [ 'pluginsDirWritable' => (bool)$pluginsWritable, 'contentDirWritable' => (bool)$contentWritable ],
        'updates' => [ 'pluginsCount' => count($pluginCandidates), 'plugins' => $pluginCandidates ],
    ];
    return new WP_REST_Response($resp, 200);
}
