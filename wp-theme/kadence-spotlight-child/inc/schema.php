<?php
/**
 * Enhanced JSON-LD Schema Markup.
 *
 * Outputs structured data that Yoast/RankMath often miss:
 * - SiteNavigationElement for nav menus
 * - ReadingTime on articles
 * - FAQPage when FAQ blocks are detected
 * - BreadcrumbList (standalone, works with any SEO plugin)
 *
 * @package kadence-spotlight-child
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_footer', 'ksc_output_schema', 99 );
function ksc_output_schema() {
	$schemas = array();

	if ( is_front_page() || is_home() ) {
		$schemas[] = ksc_schema_website();
		$schemas[] = ksc_schema_organization();
	}

	if ( is_singular( 'post' ) ) {
		$schemas[] = ksc_schema_article();
		$schemas[] = ksc_schema_breadcrumb_post();

		// FAQ detection: if the post contains WP FAQ blocks, output FAQPage
		if ( has_block( 'rank-math/faq-block' ) || has_block( 'yoast/faq-block' ) || strpos( get_the_content(), 'wp-block-faq' ) !== false ) {
			$faq = ksc_schema_faq();
			if ( $faq ) $schemas[] = $faq;
		}
	}

	if ( is_singular( 'page' ) ) {
		$schemas[] = ksc_schema_webpage();
	}

	if ( is_category() || is_tag() || is_tax() ) {
		$schemas[] = ksc_schema_collection_page();
	}

	foreach ( $schemas as $schema ) {
		if ( empty( $schema ) ) continue;
		echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
	}
}

// ── WebSite schema with SearchAction ──────────────────────────────────────

function ksc_schema_website() {
	return array(
		'@context' => 'https://schema.org',
		'@type'    => 'WebSite',
		'@id'      => home_url( '/#website' ),
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
		'description' => get_bloginfo( 'description' ),
		'inLanguage'  => get_bloginfo( 'language' ),
		'potentialAction' => array(
			'@type'       => 'SearchAction',
			'target'      => array(
				'@type'     => 'EntryPoint',
				'urlTemplate' => home_url( '/?s={search_term_string}' ),
			),
			'query-input' => 'required name=search_term_string',
		),
	);
}

// ── Organization schema ───────────────────────────────────────────────────

function ksc_schema_organization() {
	$logo_id  = get_theme_mod( 'custom_logo' );
	$logo_url = $logo_id ? wp_get_attachment_url( $logo_id ) : '';

	$schema = array(
		'@context' => 'https://schema.org',
		'@type'    => array( 'Organization', 'NewsMediaOrganization' ),
		'@id'      => home_url( '/#organization' ),
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
		'sameAs'   => ksc_get_social_urls(),
	);

	if ( $logo_url ) {
		$schema['logo'] = array(
			'@type'  => 'ImageObject',
			'@id'    => home_url( '/#logo' ),
			'url'    => $logo_url,
			'contentUrl' => $logo_url,
		);
	}

	return $schema;
}

// ── Article / BlogPosting schema ──────────────────────────────────────────

function ksc_schema_article() {
	global $post;

	$author_id   = $post->post_author;
	$author_name = get_the_author_meta( 'display_name', $author_id );
	$author_url  = get_author_posts_url( $author_id );

	$image_url = '';
	$image_w   = 1200;
	$image_h   = 675;
	if ( has_post_thumbnail() ) {
		$img = wp_get_attachment_image_src( get_post_thumbnail_id(), 'ksc-hero' );
		if ( $img ) {
			$image_url = $img[0];
			$image_w   = $img[1];
			$image_h   = $img[2];
		}
	}

	$categories = get_the_category();
	$cat_name   = $categories ? $categories[0]->name : '';

	$word_count   = str_word_count( wp_strip_all_tags( get_the_content() ) );
	$reading_time = ksc_reading_time();

	$schema = array(
		'@context'         => 'https://schema.org',
		'@type'            => in_array( $cat_name, array( 'News', 'Berita', 'Isu Semasa' ), true ) ? 'NewsArticle' : 'BlogPosting',
		'@id'              => get_permalink() . '#article',
		'mainEntityOfPage' => array(
			'@type' => 'WebPage',
			'@id'   => get_permalink(),
		),
		'headline'         => get_the_title(),
		'description'      => has_excerpt() ? strip_tags( get_the_excerpt() ) : wp_trim_words( get_the_content(), 30 ),
		'datePublished'    => get_the_date( DATE_ISO8601 ),
		'dateModified'     => get_the_modified_date( DATE_ISO8601 ),
		'wordCount'        => $word_count,
		'timeRequired'     => 'PT' . $reading_time . 'M',
		'inLanguage'       => get_bloginfo( 'language' ),
		'author'           => array(
			'@type' => 'Person',
			'name'  => $author_name,
			'url'   => $author_url,
		),
		'publisher' => array(
			'@type' => 'Organization',
			'@id'   => home_url( '/#organization' ),
			'name'  => get_bloginfo( 'name' ),
		),
	);

	if ( $image_url ) {
		$schema['image'] = array(
			'@type'  => 'ImageObject',
			'url'    => $image_url,
			'width'  => $image_w,
			'height' => $image_h,
		);
		// NewsArticle needs array of images
		$schema['image'] = array( $image_url );
	}

	if ( $cat_name ) {
		$schema['articleSection'] = $cat_name;
	}

	$tags = get_the_tags();
	if ( $tags ) {
		$schema['keywords'] = implode( ', ', wp_list_pluck( $tags, 'name' ) );
	}

	// Comment count for BlogPosting
	$comment_count = (int) get_comments_number();
	if ( $comment_count > 0 ) {
		$schema['commentCount'] = $comment_count;
	}

	return $schema;
}

// ── WebPage schema (static pages) ─────────────────────────────────────────

function ksc_schema_webpage() {
	return array(
		'@context'         => 'https://schema.org',
		'@type'            => 'WebPage',
		'@id'              => get_permalink(),
		'name'             => get_the_title(),
		'description'      => has_excerpt() ? strip_tags( get_the_excerpt() ) : get_bloginfo( 'description' ),
		'url'              => get_permalink(),
		'datePublished'    => get_the_date( DATE_ISO8601 ),
		'dateModified'     => get_the_modified_date( DATE_ISO8601 ),
		'inLanguage'       => get_bloginfo( 'language' ),
		'isPartOf'         => array( '@id' => home_url( '/#website' ) ),
		'publisher'        => array( '@id' => home_url( '/#organization' ) ),
	);
}

// ── CollectionPage (archive, category, tag) ───────────────────────────────

function ksc_schema_collection_page() {
	$term = get_queried_object();
	return array(
		'@context'    => 'https://schema.org',
		'@type'       => 'CollectionPage',
		'name'        => $term->name,
		'description' => strip_tags( $term->description ) ?: get_bloginfo( 'description' ),
		'url'         => get_term_link( $term ),
		'isPartOf'    => array( '@id' => home_url( '/#website' ) ),
	);
}

// ── BreadcrumbList for posts ───────────────────────────────────────────────

function ksc_schema_breadcrumb_post() {
	$items = array(
		array(
			'@type'    => 'ListItem',
			'position' => 1,
			'name'     => __( 'Home', 'kadence-spotlight-child' ),
			'item'     => home_url( '/' ),
		),
	);

	$position   = 2;
	$categories = get_the_category();

	if ( $categories ) {
		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $position,
			'name'     => $categories[0]->name,
			'item'     => get_category_link( $categories[0]->term_id ),
		);
		$position++;
	}

	$items[] = array(
		'@type'    => 'ListItem',
		'position' => $position,
		'name'     => get_the_title(),
		'item'     => get_permalink(),
	);

	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => $items,
	);
}

// ── FAQPage schema ────────────────────────────────────────────────────────
// Parses FAQ blocks from post content to generate FAQPage schema.
// Eligible for FAQ rich result in Google Search.

function ksc_schema_faq() {
	$content = get_the_content();
	$questions = array();

	// Parse Yoast FAQ block
	preg_match_all(
		'/<div[^>]*class="[^"]*schema-faq-question[^"]*"[^>]*>(.*?)<\/div>.*?<div[^>]*class="[^"]*schema-faq-answer[^"]*"[^>]*>(.*?)<\/div>/si',
		$content,
		$matches
	);

	if ( ! empty( $matches[1] ) ) {
		foreach ( $matches[1] as $i => $question ) {
			$questions[] = array(
				'@type'          => 'Question',
				'name'           => wp_strip_all_tags( $question ),
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => wp_strip_all_tags( $matches[2][ $i ] ),
				),
			);
		}
	}

	if ( empty( $questions ) ) return null;

	return array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $questions,
	);
}

// ── Social profile URLs ────────────────────────────────────────────────────

function ksc_get_social_urls() {
	$social = array(
		'facebook_url'  => get_theme_mod( 'ksc_facebook' ),
		'twitter_url'   => get_theme_mod( 'ksc_twitter' ),
		'instagram_url' => get_theme_mod( 'ksc_instagram' ),
		'youtube_url'   => get_theme_mod( 'ksc_youtube' ),
	);

	return array_values( array_filter( $social ) );
}

// ── Customizer fields for social URLs ─────────────────────────────────────

add_action( 'customize_register', 'ksc_customizer_social' );
function ksc_customizer_social( $wp_customize ) {
	$wp_customize->add_section( 'ksc_social', array(
		'title'    => __( 'Social Media URLs', 'kadence-spotlight-child' ),
		'priority' => 120,
	) );

	$fields = array(
		'ksc_facebook'  => __( 'Facebook URL', 'kadence-spotlight-child' ),
		'ksc_twitter'   => __( 'Twitter/X URL', 'kadence-spotlight-child' ),
		'ksc_instagram' => __( 'Instagram URL', 'kadence-spotlight-child' ),
		'ksc_youtube'   => __( 'YouTube URL', 'kadence-spotlight-child' ),
		'ksc_tiktok'    => __( 'TikTok URL', 'kadence-spotlight-child' ),
	);

	foreach ( $fields as $id => $label ) {
		$wp_customize->add_setting( $id, array( 'sanitize_callback' => 'esc_url_raw' ) );
		$wp_customize->add_control( $id, array(
			'label'   => $label,
			'section' => 'ksc_social',
			'type'    => 'url',
		) );
	}
}
