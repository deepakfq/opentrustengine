<?php
/**
 * OTE_Client — HTTP client wrapper for the OpenTrustEngine API.
 *
 * @package OpenTrustEngine
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OTE_Client {

	/**
	 * API key.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * API secret.
	 *
	 * @var string
	 */
	private $api_secret;

	/**
	 * Base URL for the API.
	 *
	 * @var string
	 */
	private $base_url;

	/**
	 * Constructor — reads credentials from WordPress options.
	 */
	public function __construct() {
		$this->api_key    = get_option( 'ote_api_key', '' );
		$this->api_secret = get_option( 'ote_api_secret', '' );
		$this->base_url   = untrailingslashit( get_option( 'ote_base_url', 'https://api.sttiz.com' ) );
	}

	/**
	 * Whether both API key and secret are present.
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		return ! empty( $this->api_key ) && ! empty( $this->api_secret );
	}

	/**
	 * POST /v1/open/events — record a single trust event.
	 *
	 * @param array $event Event payload.
	 * @return array|false Decoded response body or false on failure.
	 */
	public function record_event( array $event ) {
		return $this->post( '/v1/open/events', $event );
	}

	/**
	 * POST /v1/open/events/batch — record multiple trust events.
	 *
	 * @param array $events Array of event payloads.
	 * @return array|false
	 */
	public function record_events_batch( array $events ) {
		return $this->post( '/v1/open/events/batch', array( 'events' => $events ) );
	}

	/**
	 * GET /v1/one/profile — retrieve the full trust profile.
	 *
	 * @param string $entity_type Entity type (store, user, etc.).
	 * @param string $entity_id   Entity identifier.
	 * @return array|false
	 */
	public function get_profile( string $entity_type, string $entity_id ) {
		return $this->get( '/v1/one/profile', array(
			'entityType' => $entity_type,
			'entityId'   => $entity_id,
		) );
	}

	/**
	 * GET /v1/one/score — retrieve a quick trust score.
	 *
	 * @param string $entity_type Entity type.
	 * @param string $entity_id   Entity identifier.
	 * @return array|false
	 */
	public function get_score( string $entity_type, string $entity_id ) {
		return $this->get( '/v1/one/score', array(
			'entityType' => $entity_type,
			'entityId'   => $entity_id,
		) );
	}

	/**
	 * GET /v1/widget/config — retrieve widget configuration for badge display.
	 *
	 * @param string $mode Widget mode (badge, card, profile).
	 * @return array|false
	 */
	public function get_widget_config( string $mode = 'badge' ) {
		$entity_type = get_option( 'ote_entity_type', 'store' );
		$entity_id   = get_option( 'ote_entity_id', '' );

		return $this->get( '/v1/widget/config', array(
			'apiKey'     => $this->api_key,
			'entityType' => $entity_type,
			'entityId'   => $entity_id,
			'mode'       => $mode,
		) );
	}

	/**
	 * Send a POST request to the API.
	 *
	 * @param string $endpoint API path.
	 * @param array  $data     Request body.
	 * @return array|false
	 */
	private function post( string $endpoint, array $data ) {
		$response = wp_remote_post( $this->base_url . $endpoint, array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'X-API-Key'     => $this->api_key,
				'X-API-Secret'  => $this->api_secret,
			),
			'body'    => wp_json_encode( $data ),
			'timeout' => 10,
		) );

		if ( is_wp_error( $response ) ) {
			error_log( '[OTE] API POST error: ' . $response->get_error_message() );
			return false;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code >= 400 ) {
			error_log( '[OTE] API POST ' . $endpoint . ' returned HTTP ' . $code );
			return false;
		}

		return $body;
	}

	/**
	 * Send a GET request to the API.
	 *
	 * @param string $endpoint API path.
	 * @param array  $params   Query parameters.
	 * @return array|false
	 */
	private function get( string $endpoint, array $params = array() ) {
		$url = $this->base_url . $endpoint;
		if ( ! empty( $params ) ) {
			$url .= '?' . http_build_query( $params );
		}

		$response = wp_remote_get( $url, array(
			'headers' => array(
				'X-API-Key'    => $this->api_key,
				'X-API-Secret' => $this->api_secret,
			),
			'timeout' => 10,
		) );

		if ( is_wp_error( $response ) ) {
			error_log( '[OTE] API GET error: ' . $response->get_error_message() );
			return false;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code >= 400 ) {
			error_log( '[OTE] API GET ' . $endpoint . ' returned HTTP ' . $code );
			return false;
		}

		return $body;
	}
}
