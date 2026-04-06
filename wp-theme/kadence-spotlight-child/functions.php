<?php
/**
 * Kadence Spotlight Child Theme — functions.php
 *
 * Core: performance, SEO, schema enhancements.
 * Every function is documented with WHY it exists,
 * not just what it does.
 *
 * @package kadence-spotlight-child
 */

defined( 'ABSPATH' ) || exit;

// ── Load child theme files ─────────────────────────────────────────────────

require_once get_stylesheet_directory() . '/inc/performance.php';
require_once get_stylesheet_directory() . '/inc/seo.php';
require_once get_stylesheet_directory() . '/inc/schema.php';

// ── Enqueue styles ─────────────────────────────────────────────────────────

add_action( 'wp_enqueue_scripts', 'ksc_enqueue_styles' );
function ksc_enqueue_styles() {
	// Parent theme CSS (Kadence handles its own; we just need child on top)
	wp_enqueue_style(
		'kadence-spotlight-child',
		get_stylesheet_uri(),
		array( 'kadence-style' ),
		wp_get_theme()->get( 'Version' )
	);
}

// ── Theme setup ────────────────────────────────────────────────────────────

add_action( 'after_setup_theme', 'ksc_setup' );
function ksc_setup() {
	// Custom logo
	add_theme_support( 'custom-logo', array(
		'height'      => 60,
		'width'       => 200,
		'flex-height' => true,
		'flex-width'  => true,
	) );

	// Post thumbnails with named sizes
	add_theme_support( 'post-thumbnails' );
	add_image_size( 'ksc-hero',    1200, 675,  true );  // 16:9 hero
	add_image_size( 'ksc-card',    600,  338,  true );  // 16:9 card
	add_image_size( 'ksc-thumb',   400,  225,  true );  // 16:9 thumb
	add_image_size( 'ksc-square',  400,  400,  true );  // 1:1 sidebar

	// Block editor — use theme.json colors/fonts
	add_theme_support( 'editor-color-palette' );
	add_theme_support( 'editor-font-sizes' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'style.css' );

	// Semantic HTML5 markup
	add_theme_support( 'html5', array(
		'search-form', 'comment-form', 'comment-list',
		'gallery', 'caption', 'style', 'script',
	) );

	// Title tag handled by WordPress
	add_theme_support( 'title-tag' );

	// RSS feeds in head
	add_theme_support( 'automatic-feed-links' );

	// Responsive embeds (removes fixed width/height on iframes)
	add_theme_support( 'responsive-embeds' );

	// Wide/full-width blocks
	add_theme_support( 'align-wide' );
}

// ── Register widget areas ──────────────────────────────────────────────────

add_action( 'widgets_init', 'ksc_widgets_init' );
function ksc_widgets_init() {
	$defaults = array(
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	);

	register_sidebar( array_merge( $defaults, array(
		'name' => __( 'Main Sidebar', 'kadence-spotlight-child' ),
		'id'   => 'sidebar-1',
		'description' => __( 'Appears on posts and pages with sidebar.', 'kadence-spotlight-child' ),
	) ) );

	register_sidebar( array_merge( $defaults, array(
		'name' => __( 'Footer Column 1', 'kadence-spotlight-child' ),
		'id'   => 'footer-1',
	) ) );

	register_sidebar( array_merge( $defaults, array(
		'name' => __( 'Footer Column 2', 'kadence-spotlight-child' ),
		'id'   => 'footer-2',
	) ) );

	register_sidebar( array_merge( $defaults, array(
		'name' => __( 'Footer Column 3', 'kadence-spotlight-child' ),
		'id'   => 'footer-3',
	) ) );
}

// ── Kadence Global Palette defaults (runs once on activation) ─────────────

add_action( 'after_switch_theme', 'ksc_set_kadence_palette' );
function ksc_set_kadence_palette() {
	$palette = array(
		array( 'color' => '#2563eb', 'slug' => 'palette1', 'name' => 'Accent Blue'  ),
		array( 'color' => '#1d4ed8', 'slug' => 'palette2', 'name' => 'Accent Dark'  ),
		array( 'color' => '#111827', 'slug' => 'palette3', 'name' => 'Dark'         ),
		array( 'color' => '#374151', 'slug' => 'palette4', 'name' => 'Dark Medium'  ),
		array( 'color' => '#6b7280', 'slug' => 'palette5', 'name' => 'Gray'         ),
		array( 'color' => '#d1d5db', 'slug' => 'palette6', 'name' => 'Light Gray'   ),
		array( 'color' => '#f3f4f6', 'slug' => 'palette7', 'name' => 'Off White'    ),
		array( 'color' => '#ffffff', 'slug' => 'palette8', 'name' => 'White'        ),
	);

	// Kadence stores palette in theme_mod
	set_theme_mod( 'kadence_color_palette', $palette );

	// Kadence Global typography defaults
	set_theme_mod( 'kadence_typography_font_family', 'Inter' );

	// Button defaults
	set_theme_mod( 'kadence_buttons_0_color',            '#ffffff' );
	set_theme_mod( 'kadence_buttons_0_background',       '#2563eb' );
	set_theme_mod( 'kadence_buttons_0_border_radius',    8 );
}

// ── Google Fonts: Inter (matches Spotlight) ────────────────────────────────

add_action( 'wp_head', 'ksc_preconnect_fonts', 1 );
function ksc_preconnect_fonts() {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}

add_action( 'wp_enqueue_scripts', 'ksc_enqueue_fonts' );
function ksc_enqueue_fonts() {
	// Only 400, 600, 700 — 500 removed (saves ~20KB, unused in design)
	wp_enqueue_style(
		'ksc-inter-font',
		'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap',
		array(),
		null
	);
}

// ── Kadence: set Inter as the default font via filter ─────────────────────

add_filter( 'kadence_theme_options_defaults', 'ksc_kadence_defaults' );
function ksc_kadence_defaults( $defaults ) {
	// Body typography
	$defaults['typography']['body']['family']  = 'Inter';
	$defaults['typography']['body']['weight']  = '400';
	$defaults['typography']['body']['size']    = array( 'desktop' => 17, 'unit' => 'px' );
	$defaults['typography']['body']['lineHeight'] = array( 'desktop' => 1.75 );

	// Headings
	foreach ( array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ) as $tag ) {
		$defaults['typography'][ $tag ]['family'] = 'Inter';
		$defaults['typography'][ $tag ]['weight'] = '700';
	}

	// H1
	$defaults['typography']['h1']['size'] = array( 'desktop' => 40, 'tablet' => 32, 'mobile' => 28, 'unit' => 'px' );
	// H2
	$defaults['typography']['h2']['size'] = array( 'desktop' => 30, 'tablet' => 26, 'mobile' => 22, 'unit' => 'px' );
	// H3
	$defaults['typography']['h3']['size'] = array( 'desktop' => 22, 'tablet' => 20, 'mobile' => 18, 'unit' => 'px' );

	// Colors → match Spotlight palette
	$defaults['colors']['link']       = '#2563eb';
	$defaults['colors']['link_hover'] = '#1d4ed8';

	// Container width
	$defaults['content_width'] = 1200;

	return $defaults;
}

// ── Reading time helper (used in schema + display) ─────────────────────────

function ksc_reading_time( $post_id = null ) {
	$content   = get_post_field( 'post_content', $post_id ?: get_the_ID() );
	$word_count = str_word_count( wp_strip_all_tags( $content ) );
	$minutes   = max( 1, (int) ceil( $word_count / 230 ) ); // 230 wpm avg
	return $minutes;
}

// ── Related posts by category (lightweight, no plugin needed) ─────────────

function ksc_related_posts( $post_id = null, $count = 6 ) {
	$post_id    = $post_id ?: get_the_ID();
	$categories = wp_get_post_categories( $post_id );

	if ( empty( $categories ) ) return array();

	return get_posts( array(
		'category__in'        => $categories,
		'post__not_in'        => array( $post_id ),
		'posts_per_page'      => $count,
		'orderby'             => 'date',
		'order'               => 'DESC',
		'no_found_rows'       => true,  // no COUNT(*) — faster
		'ignore_sticky_posts' => true,
		'fields'              => 'ids',  // just IDs first, lazy load the rest
	) );
}

// ── Auto image alt from post title (same fix as Blogger template) ──────────

add_filter( 'wp_get_attachment_image_attributes', 'ksc_auto_image_alt', 10, 3 );
function ksc_auto_image_alt( $attr, $attachment, $size ) {
	if ( empty( $attr['alt'] ) ) {
		// Try attachment title, then parent post title
		$alt = trim( strip_tags( get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ) ) );
		if ( empty( $alt ) ) {
			$alt = get_the_title( $attachment->post_parent ) ?: get_bloginfo( 'name' );
		}
		$attr['alt'] = esc_attr( $alt );
	}
	return $attr;
}
