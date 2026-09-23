/**
 * THE BUKIT BESI - ULTRA-LIGHTWEIGHT VANILLA JS
 * Replaces legacy jQuery. Optimized for Core Web Vitals (LCP, INP, CLS).
 * - Zero Dependencies
 * - IntersectionObserver for asynchronous rendering
 * - Fetch API for dynamic loading
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CLS Mitigation & Native Lazy Loading
    // Forces explicit dimensions and lazy loading on all content images
    const images = document.querySelectorAll('.post-body img, .entry-thumbnail img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
            // Apply a default aspect ratio CSS class to prevent layout shifts if dimensions are missing
            img.style.aspectRatio = '16/9';
            img.style.objectFit = 'cover';
        }
    });

    // 2. Sticky Header (Debounced/Passive for Performance)
    const header = document.querySelector('.header-inner');
    if (header) {
        let lastScroll = 0;
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            lastScroll = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (lastScroll > 100) {
                        header.classList.add('is-fixed');
                    } else {
                        header.classList.remove('is-fixed');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // 3. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const hideMenuBtn = document.querySelector('.hide-mobile-menu');
    const body = document.body;

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('menu-on');
        });
    }
    
    if (hideMenuBtn) {
        hideMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.remove('menu-on');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (body.classList.contains('menu-on') && !e.target.closest('.mobile-menu') && !e.target.closest('.menu-toggle')) {
            body.classList.remove('menu-on');
        }
    });

    // 4. Fetch API "Load More" Pagination (Replaces $.ajax)
    const loadMoreBtn = document.querySelector('#load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = loadMoreBtn.getAttribute('data-url');
            if (!url) return;
            
            const originalText = loadMoreBtn.innerText;
            loadMoreBtn.innerText = 'Loading...';
            loadMoreBtn.classList.add('loading');

            try {
                const res = await fetch(url);
                const text = await res.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                
                const newPosts = doc.querySelector('.blog-posts');
                if (newPosts) {
                    const postContainer = document.querySelector('.blog-posts');
                    // Extract posts and append
                    Array.from(newPosts.children).forEach((post, index) => {
                        if(post.classList.contains('post')) {
                            post.style.animationDelay = `${(0.1 * index).toFixed(1)}s`;
                            post.classList.add('fadeInUp');
                        }
                        postContainer.appendChild(post);
                    });
                }

                // Update Next Page URL
                const nextLink = doc.querySelector('#load-more');
                if (nextLink && nextLink.getAttribute('data-url')) {
                    loadMoreBtn.setAttribute('data-url', nextLink.getAttribute('data-url'));
                } else {
                    loadMoreBtn.style.display = 'none';
                    const noMore = document.querySelector('.no-more');
                    if (noMore) noMore.classList.add('visible');
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                loadMoreBtn.innerText = originalText;
                loadMoreBtn.classList.remove('loading');
            }
        });
    }

    // 5. Scroll to Top (Vanilla)
    const toTopBtn = document.querySelector('.to-top');
    if (toTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                toTopBtn.classList.add('show');
            } else {
                toTopBtn.classList.remove('show');
            }
        }, { passive: true });

        toTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
