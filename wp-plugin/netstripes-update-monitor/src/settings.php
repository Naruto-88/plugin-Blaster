<?php
if (!defined('ABSPATH')) exit;

function nsm_get_options() {
    $opts = get_option('nsm_options');
    if (!is_array($opts)) $opts = [];
    return wp_parse_args($opts, [
        'dashboard_url' => '',
        'auth_mode' => 'bearer',
        'webhook_enabled' => false,
        'secret' => '',
    ]);
}

add_action('admin_menu', function () {
    add_options_page('Update Monitor', 'Update Monitor', 'manage_options', 'nsm-settings', 'nsm_render_settings');
});

function nsm_render_settings() {
    if (!current_user_can('manage_options')) return;
    $opts = nsm_get_options();
    if (isset($_POST['nsm_update'])) {
        check_admin_referer('nsm_save');
        $opts['dashboard_url'] = esc_url_raw($_POST['dashboard_url'] ?? '');
        $opts['auth_mode'] = in_array($_POST['auth_mode'] ?? 'bearer', ['bearer', 'app_password'], true) ? $_POST['auth_mode'] : 'bearer';
        $opts['webhook_enabled'] = isset($_POST['webhook_enabled']);
        if (isset($_POST['rotate_secret'])) {
            $opts['secret'] = wp_generate_password(32, false, false);
        }
        update_option('nsm_options', $opts);
        echo '<div class="updated"><p>Saved.</p></div>';
    }
    ?>
    <div class="wrap">
      <h1>NetStripes Update Monitor</h1>
      <form method="post">
        <?php wp_nonce_field('nsm_save'); ?>
        <table class="form-table">
          <tr><th>Dashboard URL</th><td><input type="url" name="dashboard_url" value="<?php echo esc_attr($opts['dashboard_url']); ?>" class="regular-text"></td></tr>
          <tr><th>Auth Mode</th><td>
            <select name="auth_mode">
              <option value="bearer" <?php selected($opts['auth_mode'], 'bearer'); ?>>Bearer</option>
              <option value="app_password" <?php selected($opts['auth_mode'], 'app_password'); ?>>Application Passwords</option>
            </select>
          </td></tr>
          <tr><th>Webhook</th><td>
            <label><input type="checkbox" name="webhook_enabled" <?php checked($opts['webhook_enabled']); ?>> Enable webhook push</label>
          </td></tr>
          <tr><th>Secret</th><td>
            <code><?php echo esc_html($opts['secret']); ?></code>
            <p><button class="button" name="rotate_secret" value="1">Rotate Secret</button></p>
          </td></tr>
        </table>
        <p><button class="button button-primary" name="nsm_update" value="1">Save</button></p>
      </form>
    </div>
    <?php
}

