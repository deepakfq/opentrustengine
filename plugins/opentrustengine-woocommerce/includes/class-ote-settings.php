<?php
/**
 * OTE_Settings — WordPress Settings API integration.
 *
 * Adds a "Trust Engine" sub-page under the WooCommerce menu.
 *
 * @package OpenTrustEngine
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OTE_Settings {

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_menu_page' ) );
		add_action( 'admin_init', array( self::class, 'register_settings' ) );
		add_action( 'wp_ajax_ote_test_connection', array( self::class, 'ajax_test_connection' ) );
	}

	/**
	 * Add sub-menu page under WooCommerce.
	 */
	public static function add_menu_page() {
		add_submenu_page(
			'woocommerce',
			__( 'Trust Engine Settings', 'opentrustengine' ),
			__( 'Trust Engine', 'opentrustengine' ),
			'manage_woocommerce',
			'ote-settings',
			array( self::class, 'render_settings_page' )
		);
	}

	/**
	 * Register all settings fields.
	 */
	public static function register_settings() {
		// --- API Credentials section ---
		add_settings_section(
			'ote_api_section',
			__( 'API Credentials', 'opentrustengine' ),
			function () {
				echo '<p>' . esc_html__( 'Enter your OpenTrustEngine API credentials. You can find them in your dashboard at opentrustengine.com.', 'opentrustengine' ) . '</p>';
			},
			'ote-settings'
		);

		$api_fields = array(
			'ote_api_key'    => __( 'API Key', 'opentrustengine' ),
			'ote_api_secret' => __( 'API Secret', 'opentrustengine' ),
			'ote_base_url'   => __( 'Base URL', 'opentrustengine' ),
		);

		foreach ( $api_fields as $key => $label ) {
			register_setting( 'ote_settings_group', $key, array( 'sanitize_callback' => 'sanitize_text_field' ) );
			add_settings_field( $key, $label, array( self::class, 'render_text_field' ), 'ote-settings', 'ote_api_section', array( 'key' => $key ) );
		}

		// --- Entity section ---
		add_settings_section(
			'ote_entity_section',
			__( 'Entity Configuration', 'opentrustengine' ),
			function () {
				echo '<p>' . esc_html__( 'Configure which entity trust events are recorded against.', 'opentrustengine' ) . '</p>';
			},
			'ote-settings'
		);

		register_setting( 'ote_settings_group', 'ote_entity_type', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_entity_type', __( 'Entity Type', 'opentrustengine' ), array( self::class, 'render_entity_type_field' ), 'ote-settings', 'ote_entity_section' );

		register_setting( 'ote_settings_group', 'ote_entity_id', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_entity_id', __( 'Entity ID', 'opentrustengine' ), array( self::class, 'render_text_field' ), 'ote-settings', 'ote_entity_section', array( 'key' => 'ote_entity_id' ) );

		// --- Widget section ---
		add_settings_section(
			'ote_widget_section',
			__( 'Widget Settings', 'opentrustengine' ),
			function () {
				echo '<p>' . esc_html__( 'Configure how the trust badge is displayed on your storefront.', 'opentrustengine' ) . '</p>';
			},
			'ote-settings'
		);

		register_setting( 'ote_settings_group', 'ote_widget_mode', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_widget_mode', __( 'Widget Mode', 'opentrustengine' ), array( self::class, 'render_widget_mode_field' ), 'ote-settings', 'ote_widget_section' );

		register_setting( 'ote_settings_group', 'ote_widget_theme', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_widget_theme', __( 'Widget Theme', 'opentrustengine' ), array( self::class, 'render_widget_theme_field' ), 'ote-settings', 'ote_widget_section' );

		register_setting( 'ote_settings_group', 'ote_widget_position', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_widget_position', __( 'Widget Position', 'opentrustengine' ), array( self::class, 'render_widget_position_field' ), 'ote-settings', 'ote_widget_section' );

		// --- General section ---
		add_settings_section(
			'ote_general_section',
			__( 'General', 'opentrustengine' ),
			null,
			'ote-settings'
		);

		register_setting( 'ote_settings_group', 'ote_enabled', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		add_settings_field( 'ote_enabled', __( 'Enable Plugin', 'opentrustengine' ), array( self::class, 'render_enabled_field' ), 'ote-settings', 'ote_general_section' );
	}

	// ------------------------------------------------------------------
	// Field renderers
	// ------------------------------------------------------------------

	/**
	 * Render a text input field.
	 *
	 * @param array $args Field arguments containing 'key'.
	 */
	public static function render_text_field( $args ) {
		$key   = $args['key'];
		$value = get_option( $key, '' );
		$type  = ( 'ote_api_secret' === $key ) ? 'password' : 'text';
		printf(
			'<input type="%s" name="%s" value="%s" class="regular-text" />',
			esc_attr( $type ),
			esc_attr( $key ),
			esc_attr( $value )
		);
	}

	/**
	 * Render entity type select.
	 */
	public static function render_entity_type_field() {
		$value   = get_option( 'ote_entity_type', 'store' );
		$options = array(
			'store' => __( 'Store', 'opentrustengine' ),
			'user'  => __( 'User', 'opentrustengine' ),
		);
		echo '<select name="ote_entity_type">';
		foreach ( $options as $k => $label ) {
			printf(
				'<option value="%s" %s>%s</option>',
				esc_attr( $k ),
				selected( $value, $k, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
	}

	/**
	 * Render widget mode select.
	 */
	public static function render_widget_mode_field() {
		$value   = get_option( 'ote_widget_mode', 'badge' );
		$options = array(
			'badge'   => __( 'Badge', 'opentrustengine' ),
			'card'    => __( 'Card', 'opentrustengine' ),
			'profile' => __( 'Profile', 'opentrustengine' ),
		);
		echo '<select name="ote_widget_mode">';
		foreach ( $options as $k => $label ) {
			printf(
				'<option value="%s" %s>%s</option>',
				esc_attr( $k ),
				selected( $value, $k, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
		echo '<p class="description">' . esc_html__( 'Badge: small inline badge. Card: medium summary card. Profile: full trust profile.', 'opentrustengine' ) . '</p>';
	}

	/**
	 * Render widget theme select.
	 */
	public static function render_widget_theme_field() {
		$value   = get_option( 'ote_widget_theme', 'light' );
		$options = array(
			'light' => __( 'Light', 'opentrustengine' ),
			'dark'  => __( 'Dark', 'opentrustengine' ),
		);
		echo '<select name="ote_widget_theme">';
		foreach ( $options as $k => $label ) {
			printf(
				'<option value="%s" %s>%s</option>',
				esc_attr( $k ),
				selected( $value, $k, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
	}

	/**
	 * Render widget position select.
	 */
	public static function render_widget_position_field() {
		$value   = get_option( 'ote_widget_position', 'footer' );
		$options = array(
			'header'    => __( 'Header', 'opentrustengine' ),
			'footer'    => __( 'Footer', 'opentrustengine' ),
			'sidebar'   => __( 'Sidebar (use widget)', 'opentrustengine' ),
			'shortcode' => __( 'Shortcode only', 'opentrustengine' ),
		);
		echo '<select name="ote_widget_position">';
		foreach ( $options as $k => $label ) {
			printf(
				'<option value="%s" %s>%s</option>',
				esc_attr( $k ),
				selected( $value, $k, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
		echo '<p class="description">' . esc_html__( 'Use shortcode [ote_trust_badge] for manual placement.', 'opentrustengine' ) . '</p>';
	}

	/**
	 * Render enabled checkbox.
	 */
	public static function render_enabled_field() {
		$value = get_option( 'ote_enabled', '1' );
		printf(
			'<label><input type="checkbox" name="ote_enabled" value="1" %s /> %s</label>',
			checked( $value, '1', false ),
			esc_html__( 'Enable trust event tracking and widget display.', 'opentrustengine' )
		);
	}

	// ------------------------------------------------------------------
	// Settings page
	// ------------------------------------------------------------------

	/**
	 * Render the full settings page.
	 */
	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		// Fetch current trust score for display.
		$score_html = '';
		$client     = new OTE_Client();
		if ( $client->is_configured() ) {
			$entity_type = get_option( 'ote_entity_type', 'store' );
			$entity_id   = get_option( 'ote_entity_id', '' );
			if ( ! empty( $entity_id ) ) {
				$result = $client->get_score( $entity_type, $entity_id );
				if ( $result && isset( $result['score'] ) ) {
					$score_html = sprintf(
						'<div class="ote-current-score"><h3>%s</h3><span class="ote-score-value">%s</span><span class="ote-score-label"> / 100</span></div>',
						esc_html__( 'Current Trust Score', 'opentrustengine' ),
						esc_html( number_format( (float) $result['score'], 1 ) )
					);
				}
			}
		}

		?>
		<div class="wrap ote-settings-wrap">
			<h1><?php echo esc_html__( 'OpenTrustEngine Settings', 'opentrustengine' ); ?></h1>

			<?php echo $score_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above. ?>

			<form method="post" action="options.php" id="ote-settings-form">
				<?php
				settings_fields( 'ote_settings_group' );
				do_settings_sections( 'ote-settings' );
				submit_button();
				?>
			</form>

			<hr />

			<h2><?php echo esc_html__( 'Connection Test', 'opentrustengine' ); ?></h2>
			<p>
				<button type="button" id="ote-test-connection" class="button button-secondary">
					<?php echo esc_html__( 'Test Connection', 'opentrustengine' ); ?>
				</button>
				<span id="ote-test-result"></span>
			</p>
		</div>
		<?php
	}

	// ------------------------------------------------------------------
	// AJAX: test connection
	// ------------------------------------------------------------------

	/**
	 * Handle AJAX test connection request.
	 */
	public static function ajax_test_connection() {
		check_ajax_referer( 'ote_admin_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'opentrustengine' ) ) );
		}

		$client = new OTE_Client();
		if ( ! $client->is_configured() ) {
			wp_send_json_error( array( 'message' => __( 'API Key and Secret are required.', 'opentrustengine' ) ) );
		}

		$entity_type = get_option( 'ote_entity_type', 'store' );
		$entity_id   = get_option( 'ote_entity_id', '' );

		if ( empty( $entity_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Entity ID is required.', 'opentrustengine' ) ) );
		}

		$result = $client->get_score( $entity_type, $entity_id );

		if ( false === $result ) {
			wp_send_json_error( array( 'message' => __( 'Connection failed. Check your credentials and Base URL.', 'opentrustengine' ) ) );
		}

		wp_send_json_success( array(
			'message' => __( 'Connection successful!', 'opentrustengine' ),
			'data'    => $result,
		) );
	}
}
