<?php
/**
 * OTE_Events — WooCommerce hook handlers that fire trust events.
 *
 * @package OpenTrustEngine
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OTE_Events {

	/**
	 * Shared client instance.
	 *
	 * @var OTE_Client
	 */
	private static $client;

	/**
	 * Register WooCommerce hooks.
	 */
	public static function init() {
		if ( '1' !== get_option( 'ote_enabled' ) ) {
			return;
		}

		self::$client = new OTE_Client();
		if ( ! self::$client->is_configured() ) {
			return;
		}

		// Order completed.
		add_action( 'woocommerce_order_status_completed', array( self::class, 'on_order_completed' ) );

		// Payment complete.
		add_action( 'woocommerce_payment_complete', array( self::class, 'on_payment_complete' ) );

		// Order refunded.
		add_action( 'woocommerce_order_refunded', array( self::class, 'on_order_refunded' ), 10, 2 );

		// New review submitted.
		add_action( 'comment_post', array( self::class, 'on_review_posted' ), 10, 3 );

		// Order cancelled.
		add_action( 'woocommerce_order_status_cancelled', array( self::class, 'on_order_cancelled' ) );
	}

	// ------------------------------------------------------------------
	// Hook handlers
	// ------------------------------------------------------------------

	/**
	 * Order completed — positive trust signal.
	 *
	 * @param int $order_id WooCommerce order ID.
	 */
	public static function on_order_completed( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		// Idempotency: skip if already sent.
		if ( $order->get_meta( '_ote_completed_sent' ) ) {
			return;
		}

		$result = self::$client->record_event( array(
			'entityType' => get_option( 'ote_entity_type', 'store' ),
			'entityId'   => get_option( 'ote_entity_id', '' ),
			'eventType'  => 'order_completed',
			'role'       => 'seller',
			'rawValue'   => 1,
			'metadata'   => array(
				'orderId'       => $order_id,
				'orderValue'    => (float) $order->get_total(),
				'currency'      => $order->get_currency(),
				'items'         => $order->get_item_count(),
				'paymentMethod' => $order->get_payment_method(),
				'source'        => 'woocommerce',
			),
		) );

		if ( false !== $result ) {
			$order->update_meta_data( '_ote_completed_sent', time() );
			$order->save();
		}
	}

	/**
	 * Payment received — positive trust signal.
	 *
	 * @param int $order_id WooCommerce order ID.
	 */
	public static function on_payment_complete( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		if ( $order->get_meta( '_ote_payment_sent' ) ) {
			return;
		}

		$result = self::$client->record_event( array(
			'entityType' => get_option( 'ote_entity_type', 'store' ),
			'entityId'   => get_option( 'ote_entity_id', '' ),
			'eventType'  => 'payment_received',
			'role'       => 'seller',
			'rawValue'   => 1,
			'metadata'   => array(
				'orderId'       => $order_id,
				'amount'        => (float) $order->get_total(),
				'currency'      => $order->get_currency(),
				'paymentMethod' => $order->get_payment_method(),
				'source'        => 'woocommerce',
			),
		) );

		if ( false !== $result ) {
			$order->update_meta_data( '_ote_payment_sent', time() );
			$order->save();
		}
	}

	/**
	 * Order refunded — negative trust signal.
	 *
	 * @param int $order_id  WooCommerce order ID.
	 * @param int $refund_id WooCommerce refund ID.
	 */
	public static function on_order_refunded( $order_id, $refund_id ) {
		$order  = wc_get_order( $order_id );
		$refund = wc_get_order( $refund_id );
		if ( ! $order || ! $refund ) {
			return;
		}

		// Use refund-specific meta key so each refund is sent exactly once.
		$meta_key = '_ote_refund_sent_' . $refund_id;
		if ( $order->get_meta( $meta_key ) ) {
			return;
		}

		$refund_amount = (float) $refund->get_amount();
		$order_total   = (float) $order->get_total();

		$result = self::$client->record_event( array(
			'entityType' => get_option( 'ote_entity_type', 'store' ),
			'entityId'   => get_option( 'ote_entity_id', '' ),
			'eventType'  => 'refund_issued',
			'role'       => 'seller',
			'rawValue'   => -1,
			'metadata'   => array(
				'orderId'      => $order_id,
				'refundId'     => $refund_id,
				'refundAmount' => $refund_amount,
				'orderTotal'   => $order_total,
				'currency'     => $order->get_currency(),
				'refundRatio'  => $order_total > 0 ? round( $refund_amount / $order_total, 4 ) : 0,
				'reason'       => $refund->get_reason(),
				'source'       => 'woocommerce',
			),
		) );

		if ( false !== $result ) {
			$order->update_meta_data( $meta_key, time() );
			$order->save();
		}
	}

	/**
	 * Review (comment) posted on a product — positive trust signal.
	 *
	 * @param int        $comment_id       Comment ID.
	 * @param int|string $comment_approved Approval status.
	 * @param array      $comment_data     Comment data.
	 */
	public static function on_review_posted( $comment_id, $comment_approved, $comment_data ) {
		// Only act on product reviews.
		$comment = get_comment( $comment_id );
		if ( ! $comment || 'product' !== get_post_type( $comment->comment_post_ID ) ) {
			return;
		}

		// Only send for approved reviews.
		if ( 1 !== (int) $comment_approved ) {
			return;
		}

		$rating = (int) get_comment_meta( $comment_id, 'rating', true );

		$result = self::$client->record_event( array(
			'entityType' => get_option( 'ote_entity_type', 'store' ),
			'entityId'   => get_option( 'ote_entity_id', '' ),
			'eventType'  => 'review_received',
			'role'       => 'seller',
			'rawValue'   => $rating > 0 ? $rating : 1,
			'metadata'   => array(
				'commentId'  => $comment_id,
				'productId'  => $comment->comment_post_ID,
				'rating'     => $rating,
				'authorName' => $comment->comment_author,
				'approved'   => true,
				'source'     => 'woocommerce',
			),
		) );

		if ( false !== $result ) {
			update_comment_meta( $comment_id, '_ote_review_sent', time() );
		}
	}

	/**
	 * Order cancelled — negative trust signal.
	 *
	 * @param int $order_id WooCommerce order ID.
	 */
	public static function on_order_cancelled( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		if ( $order->get_meta( '_ote_cancelled_sent' ) ) {
			return;
		}

		$result = self::$client->record_event( array(
			'entityType' => get_option( 'ote_entity_type', 'store' ),
			'entityId'   => get_option( 'ote_entity_id', '' ),
			'eventType'  => 'order_cancelled',
			'role'       => 'seller',
			'rawValue'   => -1,
			'metadata'   => array(
				'orderId'    => $order_id,
				'orderValue' => (float) $order->get_total(),
				'currency'   => $order->get_currency(),
				'items'      => $order->get_item_count(),
				'source'     => 'woocommerce',
			),
		) );

		if ( false !== $result ) {
			$order->update_meta_data( '_ote_cancelled_sent', time() );
			$order->save();
		}
	}
}
