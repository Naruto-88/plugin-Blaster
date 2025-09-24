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

