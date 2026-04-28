=== OpenTrustEngine ===
Contributors: sttiz
Tags: trust, woocommerce, reviews, trust score, badge, reputation
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
WC requires at least: 5.0
WC tested up to: 8.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build and display trust scores for your WooCommerce store. Automatically tracks orders, payments, refunds, and reviews.

== Description ==

OpenTrustEngine connects your WooCommerce store to the OpenTrustEngine platform, automatically building a verifiable trust profile based on real transaction data.

**What it does:**

* Sends a trust event when an order is completed
* Sends a trust event when payment is received
* Sends a trust event when a refund is issued
* Sends a trust event when a product review is submitted
* Sends a trust event when an order is cancelled
* Displays a trust badge on your storefront (header, footer, sidebar, or shortcode)

**Why trust matters:**

Shoppers are more likely to buy from stores with a visible, verifiable trust score. OpenTrustEngine aggregates your real business activity into a single score that builds over time.

**Features:**

* Zero-config event tracking — just enter your API credentials
* Idempotent event dispatch — duplicate events are never sent
* Multiple widget display modes: badge, card, or full profile
* Light and dark theme support
* Shortcode `[ote_trust_badge]` for manual placement
* Sidebar widget for theme widget areas
* Trust event log in the admin dashboard
* Trust event status column on the orders list
* Trust event detail metabox on each order
* HPOS (High-Performance Order Storage) compatible

== Installation ==

1. Upload the `opentrustengine-woocommerce` folder to `/wp-content/plugins/`
2. Activate the plugin through the Plugins menu
3. Go to WooCommerce > Trust Engine
4. Enter your API Key, API Secret, and Entity ID from your OpenTrustEngine dashboard
5. Click "Test Connection" to verify
6. Choose your widget display preferences
7. Save settings

You can obtain API credentials by signing up at [opentrustengine.com](https://opentrustengine.com).

== Frequently Asked Questions ==

= Do I need a separate account? =

Yes. You need an OpenTrustEngine account to obtain API credentials. Visit opentrustengine.com to sign up.

= Does this slow down my store? =

No. Trust events are sent asynchronously via the WordPress HTTP API with a 10-second timeout. They do not block the customer experience.

= What if the API is unreachable? =

Events that fail to send are logged via `error_log()`. The plugin will attempt to send the event again when the corresponding WooCommerce hook fires next (e.g., if an order status is toggled back and forth). The idempotency check prevents duplicates once an event has been successfully sent.

= Can I place the badge anywhere? =

Yes. Use the shortcode `[ote_trust_badge mode="badge" theme="light"]` in any post, page, or widget area. You can also use the built-in sidebar widget or automatic header/footer placement.

= Is it compatible with WooCommerce HPOS? =

Yes. The plugin supports both the legacy post-based order storage and the new High-Performance Order Storage.

== Screenshots ==

1. Settings page with API credentials, entity configuration, and widget options.
2. Trust badge displayed in the store footer.
3. Orders list with trust event status column.
4. Order edit page with OpenTrustEngine metabox showing event dispatch status.
5. Trust event log page showing recent orders and their event history.

== Changelog ==

= 1.0.0 =
* Initial release.
* Order completed, payment received, refund issued, review submitted, and order cancelled events.
* Trust badge widget with badge, card, and profile modes.
* Admin settings page with test connection.
* Orders list trust column and order metabox.
* Trust event log page.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
