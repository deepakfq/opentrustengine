<?php
/**
 * Plugin Name: OpenTrustEngine
 * Plugin URI: https://opentrustengine.com
 * Description: Build and display trust scores for your WooCommerce store. Automatically tracks orders, payments, refunds, and reviews.
 * Version: 1.0.0
 * Author: Sttiz
 * Author URI: https://sttiz.com
 * License: GPL v2 or later
 * Text Domain: opentrustengine
 * WC requires at least: 5.0
 * WC tested up to: 8.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'OTE_VERSION', '1.0.0' );
define( 'OTE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'OTE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Autoload classes.
require_once OTE_PLUGIN_DIR . 'includes/class-ote-client.php';
require_once OTE_PLUGIN_DIR . 'includes/class-ote-settings.php';
require_once OTE_PLUGIN_DIR . 'includes/class-ote-events.php';
require_once OTE_PLUGIN_DIR . 'includes/class-ote-widget.php';
require_once OTE_PLUGIN_DIR . 'includes/class-ote-admin.php';

// Initialize plugin after all plugins are loaded.
add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', function () {
			echo '<div class="error"><p><strong>' . esc_html__( 'OpenTrustEngine', 'opentrustengine' ) . '</strong> ' . esc_html__( 'requires WooCommerce to be installed and active.', 'opentrustengine' ) . '</p></div>';
		} );
		return;
	}

	OTE_Settings::init();
	OTE_Events::init();
	OTE_Widget::init();
	OTE_Admin::init();
} );

// Activation hook — seed default options.
register_activation_hook( __FILE__, function () {
	add_option( 'ote_api_key', '' );
	add_option( 'ote_api_secret', '' );
	add_option( 'ote_entity_type', 'store' );
	add_option( 'ote_entity_id', '' );
	add_option( 'ote_base_url', 'https://api.sttiz.com' );
	add_option( 'ote_widget_mode', 'badge' );
	add_option( 'ote_widget_theme', 'light' );
	add_option( 'ote_widget_position', 'footer' );
	add_option( 'ote_enabled', '1' );
} );

// Deactivation hook — keep settings for reactivation.
register_deactivation_hook( __FILE__, function () {
	// Intentionally left empty: settings are preserved.
} );
