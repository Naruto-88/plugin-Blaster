<?php
/**
 * Plugin Name: NetStripes Update Monitor
 * Description: Exposes secure REST endpoints for core and plugin update snapshots.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: NetStripes
 */

if (!defined('ABSPATH')) exit;

define('NSM_SLUG', 'ns-monitor');

require_once __DIR__ . '/src/settings.php';
require_once __DIR__ . '/src/rest.php';

// Activation: ensure default options
register_activation_hook(__FILE__, function () {
    $defaults = [
        'dashboard_url' => '',
        'auth_mode' => 'bearer',
        'webhook_enabled' => false,
        'secret' => wp_generate_password(32, false, false),
    ];
    add_option('nsm_options', $defaults);
});

