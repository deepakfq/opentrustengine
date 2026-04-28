/**
 * OpenTrustEngine — Admin JavaScript.
 *
 * @package OpenTrustEngine
 */

/* global jQuery, oteAdmin */

(function ($) {
	'use strict';

	$(document).ready(function () {
		// -----------------------------------------------------------------
		// Test connection button
		// -----------------------------------------------------------------
		$('#ote-test-connection').on('click', function () {
			var $btn    = $(this);
			var $result = $('#ote-test-result');

			$btn.prop('disabled', true);
			$result
				.removeClass('ote-success ote-error')
				.text(oteAdmin.i18n.testing);

			$.ajax({
				url:      oteAdmin.ajaxUrl,
				method:   'POST',
				dataType: 'json',
				data: {
					action: 'ote_test_connection',
					nonce:  oteAdmin.nonce,
				},
				success: function (response) {
					if (response.success) {
						$result
							.addClass('ote-success')
							.text(response.data.message);

						if (response.data.data && typeof response.data.data.score !== 'undefined') {
							$result.append(' Score: ' + parseFloat(response.data.data.score).toFixed(1));
						}
					} else {
						$result
							.addClass('ote-error')
							.text(response.data ? response.data.message : oteAdmin.i18n.failed);
					}
				},
				error: function () {
					$result
						.addClass('ote-error')
						.text(oteAdmin.i18n.error);
				},
				complete: function () {
					$btn.prop('disabled', false);
				},
			});
		});

		// -----------------------------------------------------------------
		// Basic settings form validation
		// -----------------------------------------------------------------
		$('#ote-settings-form').on('submit', function (e) {
			var apiKey    = $('input[name="ote_api_key"]').val().trim();
			var apiSecret = $('input[name="ote_api_secret"]').val().trim();
			var entityId  = $('input[name="ote_entity_id"]').val().trim();
			var baseUrl   = $('input[name="ote_base_url"]').val().trim();

			// Only warn — do not block saving so users can clear fields if needed.
			if (apiKey && (!apiSecret || !entityId)) {
				if (!confirm('API Secret and Entity ID are recommended when an API Key is set. Save anyway?')) {
					e.preventDefault();
					return false;
				}
			}

			// Basic URL format check.
			if (baseUrl && !/^https?:\/\/.+/.test(baseUrl)) {
				alert('Base URL must start with http:// or https://');
				e.preventDefault();
				return false;
			}
		});
	});
})(jQuery);
