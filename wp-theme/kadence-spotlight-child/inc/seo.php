<?php
/**
 * SEO head optimizations.
 *
 * Works ALONGSIDE Yoast SEO or RankMath (does not replace them).
 * Adds what those plugins miss or do wrong.
 *
 * @package kadence-spotlight-child
 */

defined( 'ABSPATH' ) || exit;

// ── Canonical URL (belt-and-suspenders over Yoast/RankMath) ──────────────

add_action( 'wp_head', 'ksc_canonical', 1 );
function ksc_canonical() {
	// Let Yoast/RankMath handle it if active
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) ) return;

	$canonical = '';

	if ( is_singular() ) {
		$canonical = get_permalink();
	} elseif ( is_home() || is_front_page() ) {
		$canonical = home_url( '/' );
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$canonical = get_term_link( get_queried_object() );
	} elseif ( is_search() ) {
		$canonical = get_search_link();
	} elseif ( is_archive() ) {
		$canonical = get_post_type_archive_link( get_queried_object()->name );
	}

	if ( $canonical && ! is_wp_error( $canonical ) ) {
		// Always HTTPS
		$canonical = set_url_scheme( $canonical, 'https' );
		printf( '<link rel="canonical" href="%s">' . "\n", esc_url( $canonical ) );
	}
}

// ── Robots meta ──────────────────────────────────────────────────────────
// noindex search results (thin content) and 404 pages.
// index everything else with full image/snippet permissions.

add_action( 'wp_head', 'ksc_robots_meta', 1 );
function ksc_robots_meta() {
	// Let Yoast/RankMath handle it if active
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) ) return;

	if ( is_search() || is_404() || is_paged() ) {
		echo '<meta name="robots" content="noindex, follow">' . "\n";
	} else {
		echo '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">' . "\n";
	}
}

// ── Open Graph meta ───────────────────────────────────────────────────────
// Only runs if Yoast SEO or RankMath is NOT active.

add_action( 'wp_head', 'ksc_open_graph', 5 );
function ksc_open_graph() {
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) ) return;

	$og = ksc_get_og_data();

	echo '<meta property="og:locale" content="' . esc_attr( get_locale() ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $og['type'] ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $og['title'] ) . '">' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $og['description'] ) . '">' . "\n";
	echo '<meta property="og:url" content="' . esc_url( $og['url'] ) . '">' . "\n";

	if ( ! empty( $og['image'] ) ) {
		echo '<meta property="og:image" content="' . esc_url( $og['image'] ) . '">' . "\n";
		echo '<meta property="og:image:width" content="1200">' . "\n";
		echo '<meta property="og:image:height" content="675">' . "\n";
		echo '<meta property="og:image:type" content="image/webp">' . "\n";
		echo '<meta property="og:image:alt" content="' . esc_attr( $og['title'] ) . '">' . "\n";
	}

	// Article-specific
	if ( is_singular( 'post' ) ) {
		echo '<meta property="article:published_time" content="' . esc_attr( get_the_date( DATE_ISO8601 ) ) . '">' . "\n";
		echo '<meta property="article:modified_time" content="' . esc_attr( get_the_modified_date( DATE_ISO8601 ) ) . '">' . "\n";
		echo '<meta property="article:author" content="' . esc_attr( get_the_author() ) . '">' . "\n";

		$categories = get_the_category();
		if ( $categories ) {
			echo '<meta property="article:section" content="' . esc_attr( $categories[0]->name ) . '">' . "\n";
			foreach ( $categories as $cat ) {
				echo '<meta property="article:tag" content="' . esc_attr( $cat->name ) . '">' . "\n";
			}
		}
		$tags = get_the_tags();
		if ( $tags ) {
			foreach ( $tags as $tag ) {
				echo '<meta property="article:tag" content="' . esc_attr( $tag->name ) . '">' . "\n";
			}
		}
	}

	// Twitter card
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $og['title'] ) . '">' . "\n";
	echo '<meta name="twitter:description" content="' . esc_attr( $og['description'] ) . '">' . "\n";
	if ( ! empty( $og['image'] ) ) {
		echo '<meta name="twitter:image" content="' . esc_url( $og['image'] ) . '">' . "\n";
	}
}

// Helper: collect all OG data in one place
function ksc_get_og_data() {
	$data = array(
		'type'        => 'website',
		'title'       => get_bloginfo( 'name' ),
		'description' => get_bloginfo( 'description' ),
		'url'         => home_url( '/' ),
		'image'       => '',
	);

	if ( is_singular() ) {
		global $post;
		$data['type']        = 'article';
		$data['title']       = get_the_title();
		$data['url']         = get_permalink();
		$data['description'] = has_excerpt() ? strip_tags( get_the_excerpt() ) : wp_trim_words( get_the_content(), 30 );

		if ( has_post_thumbnail() ) {
			$img = wp_get_attachment_image_src( get_post_thumbnail_id(), 'ksc-hero' );
			if ( $img ) $data['image'] = $img[0];
		}
	} elseif ( is_home() || is_front_page() ) {
		$data['title'] = get_bloginfo( 'name' );
		$data['type']  = 'website';
		$data['url']   = home_url( '/' );
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$term = get_queried_object();
		$data['title']       = $term->name;
		$data['description'] = strip_tags( $term->description ) ?: get_bloginfo( 'description' );
		$data['url']         = get_term_link( $term );
		$data['type']        = 'object';
	}

	return $data;
}

// ── Remove WP version from all URLs (security) ────────────────────────────

add_filter( 'the_generator', '__return_empty_string' );
add_filter( 'script_loader_src', 'ksc_strip_wp_version_from_src' );
add_filter( 'style_loader_src',  'ksc_strip_wp_version_from_src' );
function ksc_strip_wp_version_from_src( $src ) {
	global $wp_version;
	return str_replace( '?ver=' . $wp_version, '', $src );
}

// ── Breadcrumbs (standalone, no plugin) ───────────────────────────────────

function ksc_breadcrumbs() {
	if ( is_front_page() ) return;

	$separator = '<span class="sep" aria-hidden="true"> › </span>';
	$home_text = __( 'Home', 'kadence-spotlight-child' );

	echo '<nav class="breadcrumb-trail" aria-label="' . esc_attr__( 'Breadcrumb', 'kadence-spotlight-child' ) . '" itemscope itemtype="https://schema.org/BreadcrumbList">';

	// Home
	echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
	echo '<a href="' . esc_url( home_url( '/' ) ) . '" itemprop="item"><span itemprop="name">' . esc_html( $home_text ) . '</span></a>';
	echo '<meta itemprop="position" content="1">';
	echo '</span>';

	$position = 2;

	if ( is_singular() ) {
		$categories = get_the_category();
		if ( $categories ) {
			echo $separator;
			echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
			echo '<a href="' . esc_url( get_category_link( $categories[0]->term_id ) ) . '" itemprop="item"><span itemprop="name">' . esc_html( $categories[0]->name ) . '</span></a>';
			echo '<meta itemprop="position" content="' . esc_attr( $position ) . '">';
			echo '</span>';
			$position++;
		}

		echo $separator;
		echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
		echo '<span itemprop="name">' . esc_html( get_the_title() ) . '</span>';
		echo '<meta itemprop="position" content="' . esc_attr( $position ) . '">';
		echo '</span>';

	} elseif ( is_category() ) {
		$cat = get_queried_object();
		if ( $cat->parent ) {
			echo $separator;
			$parent = get_term( $cat->parent, 'category' );
			echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
			echo '<a href="' . esc_url( get_category_link( $parent->term_id ) ) . '" itemprop="item"><span itemprop="name">' . esc_html( $parent->name ) . '</span></a>';
			echo '<meta itemprop="position" content="' . esc_attr( $position++ ) . '">';
			echo '</span>';
		}
		echo $separator;
		echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
		echo '<span itemprop="name">' . esc_html( single_cat_title( '', false ) ) . '</span>';
		echo '<meta itemprop="position" content="' . esc_attr( $position ) . '">';
		echo '</span>';
	}

	echo '</nav>';
}

// ── Reading time display ──────────────────────────────────────────────────

function ksc_reading_time_html( $post_id = null ) {
	$minutes = ksc_reading_time( $post_id );
	return sprintf(
		'<span class="reading-time">%s %s</span>',
		esc_html( $minutes ),
		esc_html( _n( 'min read', 'min read', $minutes, 'kadence-spotlight-child' ) )
	);
}
