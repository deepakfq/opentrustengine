<?php
/**
 * OTE_Widget — Storefront trust badge via shortcode, sidebar widget, or automatic placement.
 *
 * @package OpenTrustEngine
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OTE_Widget {

	/**
	 * Register hooks, shortcode, and sidebar widget.
	 */
	public static function init() {
		if ( '1' !== get_option( 'ote_enabled' ) ) {
			return;
		}

		add_shortcode( 'ote_trust_badge', array( self::class, 'shortcode' ) );
		add_action( 'wp_footer', array( self::class, 'footer_widget' ) );
		add_action( 'wp_head', array( self::class, 'header_widget' ) );
		add_action( 'widgets_init', array( self::class, 'register_sidebar_widget' ) );
	}

	// ------------------------------------------------------------------
	// Shortcode
	// ------------------------------------------------------------------

	/**
	 * [ote_trust_badge] shortcode handler.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string HTML output.
	 */
	public static function shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'mode'  => get_option( 'ote_widget_mode', 'badge' ),
			'theme' => get_option( 'ote_widget_theme', 'light' ),
		), $atts, 'ote_trust_badge' );

		return self::render_widget( $atts['mode'], $atts['theme'] );
	}

	// ------------------------------------------------------------------
	// Automatic placement
	// ------------------------------------------------------------------

	/**
	 * Output widget in wp_footer if position is "footer".
	 */
	public static function footer_widget() {
		if ( 'footer' !== get_option( 'ote_widget_position', 'footer' ) ) {
			return;
		}
		echo self::render_widget( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			get_option( 'ote_widget_mode', 'badge' ),
			get_option( 'ote_widget_theme', 'light' )
		);
	}

	/**
	 * Output widget in wp_head if position is "header".
	 *
	 * Adds a small inline script that moves the widget container into the
	 * visible DOM once the page body is available, because wp_head fires
	 * inside <head>.
	 */
	public static function header_widget() {
		if ( 'header' !== get_option( 'ote_widget_position', 'footer' ) ) {
			return;
		}

		$api_key     = get_option( 'ote_api_key', '' );
		$entity_id   = get_option( 'ote_entity_id', '' );
		if ( empty( $api_key ) || empty( $entity_id ) ) {
			return;
		}

		$entity_type = get_option( 'ote_entity_type', 'store' );
		$base_url    = get_option( 'ote_base_url', 'https://api.sttiz.com' );
		$mode        = get_option( 'ote_widget_mode', 'badge' );
		$theme       = get_option( 'ote_widget_theme', 'light' );
		$container   = 'ote-widget-header';

		// We output a script that waits for DOMContentLoaded, creates the
		// container as the first child of <body>, then loads the widget script.
		printf(
			'<script>document.addEventListener("DOMContentLoaded",function(){' .
			'var c=document.createElement("div");c.id=%s;document.body.insertBefore(c,document.body.firstChild);' .
			'var s=document.createElement("script");s.src="https://cdn.opentrustengine.com/v1/trust-widget.min.js";' .
			's.setAttribute("data-api-key",%s);s.setAttribute("data-entity-type",%s);' .
			's.setAttribute("data-entity-id",%s);s.setAttribute("data-mode",%s);' .
			's.setAttribute("data-theme",%s);s.setAttribute("data-base-url",%s);' .
			's.setAttribute("data-container",%s);document.body.appendChild(s);' .
			'});</script>',
			wp_json_encode( $container ),
			wp_json_encode( $api_key ),
			wp_json_encode( $entity_type ),
			wp_json_encode( $entity_id ),
			wp_json_encode( $mode ),
			wp_json_encode( $theme ),
			wp_json_encode( $base_url ),
			wp_json_encode( $container )
		);
	}

	// ------------------------------------------------------------------
	// Sidebar widget
	// ------------------------------------------------------------------

	/**
	 * Register the sidebar widget class.
	 */
	public static function register_sidebar_widget() {
		register_widget( 'OTE_Sidebar_Widget' );
	}

	// ------------------------------------------------------------------
	// Renderer
	// ------------------------------------------------------------------

	/**
	 * Render the widget HTML + CDN script tag.
	 *
	 * @param string $mode  Widget mode (badge, card, profile).
	 * @param string $theme Widget theme (light, dark).
	 * @return string
	 */
	private static function render_widget( string $mode, string $theme ): string {
		$api_key     = get_option( 'ote_api_key', '' );
		$entity_type = get_option( 'ote_entity_type', 'store' );
		$entity_id   = get_option( 'ote_entity_id', '' );
		$base_url    = get_option( 'ote_base_url', 'https://api.sttiz.com' );

		if ( empty( $api_key ) || empty( $entity_id ) ) {
			return '';
		}

		$container_id = 'ote-widget-' . wp_rand();

		return sprintf(
			'<div id="%s"></div>' .
			'<script src="https://cdn.opentrustengine.com/v1/trust-widget.min.js" ' .
			'data-api-key="%s" data-entity-type="%s" data-entity-id="%s" ' .
			'data-mode="%s" data-theme="%s" data-base-url="%s" ' .
			'data-container="%s"></script>',
			esc_attr( $container_id ),
			esc_attr( $api_key ),
			esc_attr( $entity_type ),
			esc_attr( $entity_id ),
			esc_attr( $mode ),
			esc_attr( $theme ),
			esc_attr( $base_url ),
			esc_attr( $container_id )
		);
	}
}

// ---------------------------------------------------------------------------
// WordPress sidebar widget class
// ---------------------------------------------------------------------------

class OTE_Sidebar_Widget extends WP_Widget {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			'ote_trust_badge',
			__( 'OpenTrustEngine Badge', 'opentrustengine' ),
			array(
				'description' => __( 'Displays your trust score badge.', 'opentrustengine' ),
			)
		);
	}

	/**
	 * Front-end output.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance settings.
	 */
	public function widget( $args, $instance ) {
		$mode  = ! empty( $instance['mode'] ) ? $instance['mode'] : get_option( 'ote_widget_mode', 'badge' );
		$theme = ! empty( $instance['theme'] ) ? $instance['theme'] : get_option( 'ote_widget_theme', 'light' );

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo do_shortcode( '[ote_trust_badge mode="' . esc_attr( $mode ) . '" theme="' . esc_attr( $theme ) . '"]' );
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Admin form.
	 *
	 * @param array $instance Widget instance settings.
	 */
	public function form( $instance ) {
		$title = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Trust Score', 'opentrustengine' );
		$mode  = ! empty( $instance['mode'] ) ? $instance['mode'] : 'badge';
		$theme = ! empty( $instance['theme'] ) ? $instance['theme'] : 'light';
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'opentrustengine' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
				   name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text"
				   value="<?php echo esc_attr( $title ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'mode' ) ); ?>"><?php esc_html_e( 'Mode:', 'opentrustengine' ); ?></label>
			<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'mode' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'mode' ) ); ?>">
				<option value="badge" <?php selected( $mode, 'badge' ); ?>><?php esc_html_e( 'Badge', 'opentrustengine' ); ?></option>
				<option value="card" <?php selected( $mode, 'card' ); ?>><?php esc_html_e( 'Card', 'opentrustengine' ); ?></option>
				<option value="profile" <?php selected( $mode, 'profile' ); ?>><?php esc_html_e( 'Profile', 'opentrustengine' ); ?></option>
			</select>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'theme' ) ); ?>"><?php esc_html_e( 'Theme:', 'opentrustengine' ); ?></label>
			<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'theme' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'theme' ) ); ?>">
				<option value="light" <?php selected( $theme, 'light' ); ?>><?php esc_html_e( 'Light', 'opentrustengine' ); ?></option>
				<option value="dark" <?php selected( $theme, 'dark' ); ?>><?php esc_html_e( 'Dark', 'opentrustengine' ); ?></option>
			</select>
		</p>
		<?php
	}

	/**
	 * Sanitize form values on save.
	 *
	 * @param array $new_instance New values.
	 * @param array $old_instance Old values.
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$instance          = array();
		$instance['title'] = sanitize_text_field( $new_instance['title'] ?? '' );
		$instance['mode']  = in_array( $new_instance['mode'] ?? '', array( 'badge', 'card', 'profile' ), true )
			? $new_instance['mode']
			: 'badge';
		$instance['theme'] = in_array( $new_instance['theme'] ?? '', array( 'light', 'dark' ), true )
			? $new_instance['theme']
			: 'light';
		return $instance;
	}
}
