<?php
/**
 * Performance optimizations.
 *
 * Every item here targets a specific Core Web Vitals metric.
 * LCP = Largest Contentful Paint  (target < 2.5s)
 * INP = Interaction to Next Paint  (target < 200ms)
 * CLS = Cumulative Layout Shift    (target < 0.1)
 *
 * @package kadence-spotlight-child
 */

defined( 'ABSPATH' ) || exit;

// ── Remove WordPress bloat from <head> ────────────────────────────────────
// Each removal = fewer bytes, fewer round trips.

add_action( 'init', 'ksc_clean_head' );
function ksc_clean_head() {
	// WP version in head (security + bytes)
	remove_action( 'wp_head', 'wp_generator' );

	// RSD & Windows Live Writer links (not needed for blog)
	remove_action( 'wp_head', 'rsd_link' );
	remove_action( 'wp_head', 'wlwmanifest_link' );

	// Short link (adds duplicate URL signal)
	remove_action( 'wp_head', 'wp_shortlink_wp_head' );

	// Emoji: 12KB of scripts + DNS request nobody needs
	remove_action( 'wp_head',    'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'admin_print_styles',  'print_emoji_styles' );
	remove_filter( 'the_content_feed',    'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss',    'wp_staticize_emoji' );
	remove_filter( 'wp_mail',            'wp_staticize_emoji_for_email' );

	// DNS prefetch (we add our own targeted ones)
	remove_action( 'wp_head', 'wp_resource_hints', 2 );

	// Feed links in head (optional; disable if single-language)
	// remove_action( 'wp_head', 'feed_links', 2 );
	// remove_action( 'wp_head', 'feed_links_extra', 3 );
}

// ── Add targeted resource hints ───────────────────────────────────────────
// preconnect = early TCP/TLS handshake (saves ~150ms per domain)
// dns-prefetch = fallback for browsers that don't support preconnect

add_action( 'wp_head', 'ksc_resource_hints', 1 );
function ksc_resource_hints() {
	$hints = array(
		'preconnect' => array(
			'https://fonts.googleapis.com',
			'https://fonts.gstatic.com',
			'https://pagead2.googlesyndication.com',
			'https://www.googletagmanager.com',
			'https://www.clarity.ms',
		),
		'dns-prefetch' => array(
			'https://stats.wp.com',
			'https://s.w.org',
		),
	);

	foreach ( $hints['preconnect'] as $url ) {
		$crossorigin = ( strpos( $url, 'fonts.gstatic' ) !== false ) ? ' crossorigin' : '';
		printf( '<link rel="preconnect" href="%s"%s>' . "\n", esc_url( $url ), $crossorigin );
	}
	foreach ( $hints['dns-prefetch'] as $url ) {
		printf( '<link rel="dns-prefetch" href="%s">' . "\n", esc_url( $url ) );
	}
}

// ── LCP: preload hero image on single posts ────────────────────────────────
// Tells browser to fetch the biggest image before it parses the DOM.
// This alone can cut LCP by 400-800ms on slow connections.

add_action( 'wp_head', 'ksc_preload_hero_image', 2 );
function ksc_preload_hero_image() {
	if ( ! is_singular() || ! has_post_thumbnail() ) return;

	$image_id  = get_post_thumbnail_id();
	$image_src = wp_get_attachment_image_src( $image_id, 'ksc-hero' );

	if ( ! $image_src ) return;

	printf(
		'<link rel="preload" as="image" href="%s" fetchpriority="high">' . "\n",
		esc_url( $image_src[0] )
	);
}

// ── LCP: fetchpriority=high on post featured image ────────────────────────
// Without this, browser treats hero image as normal priority.

add_filter( 'post_thumbnail_html', 'ksc_hero_image_priority', 10, 5 );
function ksc_hero_image_priority( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
	if ( is_singular() && get_post_thumbnail_id() === $post_thumbnail_id ) {
		// Replace loading="lazy" with eager + add fetchpriority
		$html = str_replace( 'loading="lazy"',   'loading="eager"',        $html );
		$html = str_replace( "loading='lazy'",    "loading='eager'",        $html );
		$html = str_replace( '<img ',             '<img fetchpriority="high" ', $html );
	}
	return $html;
}

// ── CLS: add explicit width/height to images ──────────────────────────────
// Prevents layout shift while images load.
// Kadence usually handles this, but belt-and-suspenders.

add_filter( 'wp_get_attachment_image_attributes', 'ksc_image_dimensions', 10, 3 );
function ksc_image_dimensions( $attr, $attachment, $size ) {
	if ( ! isset( $attr['width'] ) || ! isset( $attr['height'] ) ) {
		$image_data = wp_get_attachment_image_src( $attachment->ID, $size );
		if ( $image_data ) {
			$attr['width']  = $image_data[1];
			$attr['height'] = $image_data[2];
		}
	}
	return $attr;
}

// ── INP: remove jQuery from front-end if not needed ───────────────────────
// jQuery is 87KB (minified). Most modern WP themes don't need it on front-end.
// Comment this out if you have plugins that require jQuery on front-end.

add_action( 'wp_enqueue_scripts', 'ksc_dequeue_jquery', 99 );
function ksc_dequeue_jquery() {
	if ( ! is_admin() && ! is_customize_preview() ) {
		// Only dequeue if no known dependent scripts are registered
		$jquery_deps = wp_scripts()->registered['jquery-core']->deps ?? array();
		if ( empty( $jquery_deps ) ) {
			wp_dequeue_script( 'jquery' );
		}
	}
}

// ── Defer non-critical scripts ────────────────────────────────────────────
// Any script not in the exclusion list gets defer added.
// defer = parse HTML first, execute scripts after = faster INP.

add_filter( 'script_loader_tag', 'ksc_defer_scripts', 10, 3 );
function ksc_defer_scripts( $tag, $handle, $src ) {
	// Never defer these
	$no_defer = array(
		'jquery-core',
		'jquery',
		'wp-tinymce',
		'kadence-blocks-js', // Kadence blocks need sync
	);

	if ( is_admin() || is_customize_preview() ) return $tag;
	if ( in_array( $handle, $no_defer, true ) ) return $tag;

	// Already has async or defer
	if ( strpos( $tag, ' defer' ) !== false || strpos( $tag, ' async' ) !== false ) return $tag;

	return str_replace( ' src=', ' defer src=', $tag );
}

// ── Async non-critical stylesheets (Bootstrap Icons pattern) ──────────────

add_filter( 'style_loader_tag', 'ksc_async_non_critical_css', 10, 4 );
function ksc_async_non_critical_css( $html, $handle, $href, $media ) {
	// Only async comment/reply stylesheet (not needed until user scrolls)
	$async_handles = array( 'wp-block-library', 'global-styles' );

	if ( ! is_admin() && in_array( $handle, $async_handles, true ) ) {
		$html  = str_replace( "media='all'", "media='print' onload=\"this.media='all'\"", $html );
		$html .= "<noscript><link rel='stylesheet' href='" . esc_url( $href ) . "'></noscript>\n";
	}
	return $html;
}

// ── Remove query strings from static assets ───────────────────────────────
// Query strings prevent CDN/proxy caching. Removes ?ver= from JS/CSS.

add_filter( 'script_loader_src', 'ksc_remove_query_strings', 15 );
add_filter( 'style_loader_src',  'ksc_remove_query_strings', 15 );
function ksc_remove_query_strings( $src ) {
	if ( strpos( $src, '?ver=' ) ) {
		$src = remove_query_arg( 'ver', $src );
	}
	return $src;
}

// ── Disable Gutenberg block CSS for unused blocks ─────────────────────────
// WordPress loads ALL block CSS even if a block isn't on the page.
// Kadence Pro has its own setting for this, but this is a fallback.

add_filter( 'should_load_separate_core_block_assets', '__return_true' );

// ── Limit post revisions (database bloat = slower queries) ────────────────
if ( ! defined( 'WP_POST_REVISIONS' ) ) {
	define( 'WP_POST_REVISIONS', 5 );
}
