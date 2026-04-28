<?php
/**
 * OTE_Admin — Admin dashboard enhancements.
 *
 * Adds trust score column to orders list, order metabox, event log display,
 * admin assets, and AJAX handlers.
 *
 * @package OpenTrustEngine
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OTE_Admin {

	/**
	 * Register hooks.
	 */
	public static function init() {
		// Admin assets.
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_admin_assets' ) );

		// Orders list column (legacy CPT-based orders).
		add_filter( 'manage_edit-shop_order_columns', array( self::class, 'add_order_column' ) );
		add_action( 'manage_shop_order_posts_custom_column', array( self::class, 'render_order_column' ), 10, 2 );

		// HPOS (High-Performance Order Storage) column support.
		add_filter( 'manage_woocommerce_page_wc-orders_columns', array( self::class, 'add_order_column' ) );
		add_action( 'manage_woocommerce_page_wc-orders_custom_column', array( self::class, 'render_order_column_hpos' ), 10, 2 );

		// Order edit metabox.
		add_action( 'add_meta_boxes', array( self::class, 'add_order_metabox' ) );

		// Trust event log page.
		add_action( 'admin_menu', array( self::class, 'add_event_log_page' ) );

		// AJAX: test connection (nonce is verified inside the handler).
		add_action( 'wp_ajax_ote_test_connection', array( self::class, 'handle_test_connection' ), 5 );
	}

	// ------------------------------------------------------------------
	// Admin assets
	// ------------------------------------------------------------------

	/**
	 * Enqueue admin CSS and JS on relevant pages.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 */
	public static function enqueue_admin_assets( $hook_suffix ) {
		$ote_pages = array(
			'woocommerce_page_ote-settings',
			'woocommerce_page_ote-event-log',
		);

		$is_ote_page = in_array( $hook_suffix, $ote_pages, true );
		$is_order    = in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) && 'shop_order' === ( $_GET['post_type'] ?? get_post_type( $_GET['post'] ?? 0 ) ); // phpcs:ignore

		if ( $is_ote_page || $is_order ) {
			wp_enqueue_style(
				'ote-admin-css',
				OTE_PLUGIN_URL . 'assets/css/admin.css',
				array(),
				OTE_VERSION
			);
		}

		if ( $is_ote_page ) {
			wp_enqueue_script(
				'ote-admin-js',
				OTE_PLUGIN_URL . 'assets/js/admin.js',
				array( 'jquery' ),
				OTE_VERSION,
				true
			);
			wp_localize_script( 'ote-admin-js', 'oteAdmin', array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'ote_admin_nonce' ),
				'i18n'    => array(
					'testing'    => __( 'Testing...', 'opentrustengine' ),
					'success'    => __( 'Connection successful!', 'opentrustengine' ),
					'failed'     => __( 'Connection failed.', 'opentrustengine' ),
					'error'      => __( 'An error occurred.', 'opentrustengine' ),
					'fillFields' => __( 'Please save your API credentials first.', 'opentrustengine' ),
				),
			) );
		}
	}

	// ------------------------------------------------------------------
	// Orders list column
	// ------------------------------------------------------------------

	/**
	 * Add "Trust Events" column to the orders list.
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public static function add_order_column( $columns ) {
		$new_columns = array();
		foreach ( $columns as $key => $label ) {
			$new_columns[ $key ] = $label;
			// Insert after order status column.
			if ( 'order_status' === $key ) {
				$new_columns['ote_trust'] = __( 'Trust Events', 'opentrustengine' );
			}
		}
		return $new_columns;
	}

	/**
	 * Render the trust column value for legacy CPT orders.
	 *
	 * @param string $column  Column key.
	 * @param int    $post_id Post (order) ID.
	 */
	public static function render_order_column( $column, $post_id ) {
		if ( 'ote_trust' !== $column ) {
			return;
		}
		self::output_order_trust_badges( $post_id );
	}

	/**
	 * Render the trust column value for HPOS orders.
	 *
	 * @param string        $column Column key.
	 * @param \WC_Order|int $order  Order object or ID.
	 */
	public static function render_order_column_hpos( $column, $order ) {
		if ( 'ote_trust' !== $column ) {
			return;
		}
		$order_id = is_object( $order ) ? $order->get_id() : (int) $order;
		self::output_order_trust_badges( $order_id );
	}

	/**
	 * Output small badge icons indicating which trust events have been sent.
	 *
	 * @param int $order_id Order ID.
	 */
	private static function output_order_trust_badges( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			echo '&mdash;';
			return;
		}

		$events = array();
		if ( $order->get_meta( '_ote_completed_sent' ) ) {
			$events[] = '<span class="ote-badge ote-badge--completed" title="' . esc_attr__( 'Order completed event sent', 'opentrustengine' ) . '">Completed</span>';
		}
		if ( $order->get_meta( '_ote_payment_sent' ) ) {
			$events[] = '<span class="ote-badge ote-badge--payment" title="' . esc_attr__( 'Payment event sent', 'opentrustengine' ) . '">Payment</span>';
		}
		if ( $order->get_meta( '_ote_cancelled_sent' ) ) {
			$events[] = '<span class="ote-badge ote-badge--cancelled" title="' . esc_attr__( 'Cancellation event sent', 'opentrustengine' ) . '">Cancelled</span>';
		}

		// Check for any refund events.
		$refund_ids = $order->get_refunds();
		foreach ( $refund_ids as $refund ) {
			$refund_id = $refund->get_id();
			if ( $order->get_meta( '_ote_refund_sent_' . $refund_id ) ) {
				$events[] = '<span class="ote-badge ote-badge--refund" title="' . esc_attr__( 'Refund event sent', 'opentrustengine' ) . '">Refund</span>';
			}
		}

		echo ! empty( $events ) ? implode( ' ', $events ) : '&mdash;'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	// ------------------------------------------------------------------
	// Order edit metabox
	// ------------------------------------------------------------------

	/**
	 * Register the trust score metabox on the order edit page.
	 */
	public static function add_order_metabox() {
		$screen = class_exists( '\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController' )
			&& wc_get_container()->get( \Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController::class )->custom_orders_table_usage_is_enabled()
			? wc_get_page_screen_id( 'shop-order' )
			: 'shop_order';

		add_meta_box(
			'ote_trust_metabox',
			__( 'OpenTrustEngine', 'opentrustengine' ),
			array( self::class, 'render_order_metabox' ),
			$screen,
			'side',
			'default'
		);
	}

	/**
	 * Render the order metabox content.
	 *
	 * @param \WP_Post|\WC_Order $post_or_order Post or order object.
	 */
	public static function render_order_metabox( $post_or_order ) {
		$order = ( $post_or_order instanceof \WC_Order ) ? $post_or_order : wc_get_order( $post_or_order->ID );
		if ( ! $order ) {
			echo '<p>' . esc_html__( 'Order not found.', 'opentrustengine' ) . '</p>';
			return;
		}

		$events = array(
			'completed' => array(
				'label' => __( 'Order Completed', 'opentrustengine' ),
				'meta'  => '_ote_completed_sent',
			),
			'payment' => array(
				'label' => __( 'Payment Received', 'opentrustengine' ),
				'meta'  => '_ote_payment_sent',
			),
			'cancelled' => array(
				'label' => __( 'Order Cancelled', 'opentrustengine' ),
				'meta'  => '_ote_cancelled_sent',
			),
		);

		echo '<table class="ote-metabox-table">';
		foreach ( $events as $key => $event ) {
			$timestamp = $order->get_meta( $event['meta'] );
			$status    = $timestamp
				? '<span class="ote-status ote-status--sent">' . esc_html__( 'Sent', 'opentrustengine' ) . '</span> <small>' . esc_html( gmdate( 'Y-m-d H:i', (int) $timestamp ) ) . '</small>'
				: '<span class="ote-status ote-status--pending">' . esc_html__( 'Not sent', 'opentrustengine' ) . '</span>';

			printf(
				'<tr><td><strong>%s</strong></td><td>%s</td></tr>',
				esc_html( $event['label'] ),
				$status // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
			);
		}

		// Refunds.
		$refunds = $order->get_refunds();
		foreach ( $refunds as $refund ) {
			$refund_id = $refund->get_id();
			$timestamp = $order->get_meta( '_ote_refund_sent_' . $refund_id );
			$status    = $timestamp
				? '<span class="ote-status ote-status--sent">' . esc_html__( 'Sent', 'opentrustengine' ) . '</span> <small>' . esc_html( gmdate( 'Y-m-d H:i', (int) $timestamp ) ) . '</small>'
				: '<span class="ote-status ote-status--pending">' . esc_html__( 'Not sent', 'opentrustengine' ) . '</span>';

			printf(
				'<tr><td><strong>%s #%d</strong></td><td>%s</td></tr>',
				esc_html__( 'Refund', 'opentrustengine' ),
				(int) $refund_id,
				$status // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			);
		}

		echo '</table>';
	}

	// ------------------------------------------------------------------
	// Event log page
	// ------------------------------------------------------------------

	/**
	 * Add the event log sub-page under WooCommerce.
	 */
	public static function add_event_log_page() {
		add_submenu_page(
			'woocommerce',
			__( 'Trust Event Log', 'opentrustengine' ),
			__( 'Trust Event Log', 'opentrustengine' ),
			'manage_woocommerce',
			'ote-event-log',
			array( self::class, 'render_event_log_page' )
		);
	}

	/**
	 * Render the event log page — shows recent orders with their trust event status.
	 */
	public static function render_event_log_page() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		$per_page = 25;
		$paged    = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification

		$orders = wc_get_orders( array(
			'limit'   => $per_page,
			'paged'   => $paged,
			'orderby' => 'date',
			'order'   => 'DESC',
		) );

		?>
		<div class="wrap ote-event-log-wrap">
			<h1><?php echo esc_html__( 'Trust Event Log', 'opentrustengine' ); ?></h1>
			<p><?php echo esc_html__( 'Recent orders and their trust event dispatch status.', 'opentrustengine' ); ?></p>

			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th><?php echo esc_html__( 'Order', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Date', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Status', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Total', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Completed', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Payment', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Cancelled', 'opentrustengine' ); ?></th>
						<th><?php echo esc_html__( 'Refunds', 'opentrustengine' ); ?></th>
					</tr>
				</thead>
				<tbody>
				<?php if ( empty( $orders ) ) : ?>
					<tr><td colspan="8"><?php echo esc_html__( 'No orders found.', 'opentrustengine' ); ?></td></tr>
				<?php else : ?>
					<?php foreach ( $orders as $order ) : ?>
						<?php
						$oid = $order->get_id();
						$check = '<span class="dashicons dashicons-yes-alt ote-icon--sent"></span>';
						$cross = '<span class="dashicons dashicons-minus ote-icon--pending"></span>';
						$refund_count = 0;
						foreach ( $order->get_refunds() as $r ) {
							if ( $order->get_meta( '_ote_refund_sent_' . $r->get_id() ) ) {
								$refund_count++;
							}
						}
						?>
						<tr>
							<td><a href="<?php echo esc_url( $order->get_edit_order_url() ); ?>">#<?php echo esc_html( $oid ); ?></a></td>
							<td><?php echo esc_html( $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i' ) : '—' ); ?></td>
							<td><?php echo esc_html( wc_get_order_status_name( $order->get_status() ) ); ?></td>
							<td><?php echo wp_kses_post( $order->get_formatted_order_total() ); ?></td>
							<td><?php echo $order->get_meta( '_ote_completed_sent' ) ? $check : $cross; // phpcs:ignore ?></td>
							<td><?php echo $order->get_meta( '_ote_payment_sent' ) ? $check : $cross; // phpcs:ignore ?></td>
							<td><?php echo $order->get_meta( '_ote_cancelled_sent' ) ? $check : $cross; // phpcs:ignore ?></td>
							<td><?php echo $refund_count > 0 ? esc_html( $refund_count ) : $cross; // phpcs:ignore ?></td>
						</tr>
					<?php endforeach; ?>
				<?php endif; ?>
				</tbody>
			</table>

			<?php
			// Simple pagination.
			$prev = $paged - 1;
			$next = $paged + 1;
			echo '<div class="tablenav bottom"><div class="tablenav-pages">';
			if ( $prev >= 1 ) {
				printf( '<a class="button" href="%s">&laquo; %s</a> ', esc_url( add_query_arg( 'paged', $prev ) ), esc_html__( 'Previous', 'opentrustengine' ) );
			}
			if ( count( $orders ) === $per_page ) {
				printf( '<a class="button" href="%s">%s &raquo;</a>', esc_url( add_query_arg( 'paged', $next ) ), esc_html__( 'Next', 'opentrustengine' ) );
			}
			echo '</div></div>';
			?>
		</div>
		<?php
	}

	// ------------------------------------------------------------------
	// AJAX: test connection (early priority so it can coexist with OTE_Settings)
	// ------------------------------------------------------------------

	/**
	 * Handle test connection — delegates to OTE_Settings if loaded.
	 * This handler fires at priority 5 so it does not conflict.
	 */
	public static function handle_test_connection() {
		// OTE_Settings::ajax_test_connection already handles this at priority 10.
		// This method intentionally left as a no-op to avoid duplicate handling.
	}
}
