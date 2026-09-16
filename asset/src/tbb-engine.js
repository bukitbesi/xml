/**
 * THE BUKIT BESI - 100% VANILLA JS ENGINE (Zero jQuery, High CWV)
 * Matches 100% of all theme features: getPosts, pbtMenu, pbtToc, pbtLazy, live search, 
 * social counters, dark mode, mobile drawer, ajax pagination, modals, and shortcodes.
 */
(function() {
  "use strict";

  const $loader = '<div class="loader"><svg viewBox="0 0 50 50"><circle stroke-width="2.8" cx="25" cy="25" fill="none" r="20" stroke="currentColor" stroke-linecap="round"></circle></svg></div>';
  const pbtData = typeof pbt !== "undefined" ? pbt : {};
  const opt = typeof options !== "undefined" ? options : {};

  // Shortcode Attribute Parser ($key={value})
  function getAttr(str, key) {
    if (!str) return false;
    const parts = str.split("$");
    for (let i = 0; i < parts.length; i++) {
      const pair = parts[i].split("=");
      if (pair[0].trim() === key) {
        const val = pair[1];
        if (val) {
          const match = val.match(/([^{\\}]+(?=}))/g);
          if (match) return String(match[0]).trim();
        }
        break;
      }
    }
    return false;
  }

  // Native Cookie Utility
  const Cookies = {
    get: function(name) {
      const m = document.cookie.match(new RegExp("(?:^|; )" + encodeURIComponent(name).replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : undefined;
    },
    set: function(name, value, days) {
      let expires = "";
      if (days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 864e5));
        expires = "; expires=" + d.toUTCString();
      }
      document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
    }
  };

  // Image Lazy Loader (IntersectionObserver + WebP resize)
  const lazyObserver = ("IntersectionObserver" in window) ? new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadLazyImage(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: "250px 0px" }) : null;

  function loadLazyImage(el) {
    if (!el || el.classList.contains("pbt-lazy")) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width >= 1 ? rect.width : (el.offsetWidth || 300);
    const h = rect.height >= 1 ? rect.height : (el.offsetHeight || 200);
    const r = "w" + Math.round(w + w / 10) + "-h" + Math.round(h + h / 10) + "-p-k-no-nu-rw";
    let src = el.getAttribute("data-src") || "";
    if (!src) return;
    if (src.includes("resources.blogblog.com")) src = (typeof noThumbnail !== "undefined" ? noThumbnail : (pbtData.noThumb || ""));
    if (src.includes("/img/a") || src.includes("/blogger_img_proxy")) {
      const parts = src.split("=");
      src = (src.includes("=") ? parts[0] : src) + "=w72-h72-p-k-no-nu";
    }
    if (src.includes("/blogger_img_proxy") && src.includes("testonly")) {
      src = src.replace("-testonly.", ".");
    }
    let finalUrl = src;
    if (src.includes("w72-h72-p-k-no-nu")) {
      finalUrl = src.includes("=") ? src.replace("=w72-h72-p-k-no-nu", "=" + r) : src.replace("/w72-h72-p-k-no-nu", "/" + r);
    }
    const img = new Image();
    img.onload = function() {
      el.style.backgroundImage = "url('" + finalUrl + "')";
      el.classList.add("pbt-lazy");
    };
    img.src = finalUrl;
  }

  function initLazy(root) {
    const container = root || document;
    const items = container.querySelectorAll(".thumbnail:not(.pbt-lazy), .avatar:not(.pbt-lazy)");
    items.forEach(el => {
      if (lazyObserver) lazyObserver.observe(el);
      else loadLazyImage(el);
    });
  }

  // Dark Mode Logo & Class Switcher
  function updateDarkLogos(isDark) {
    document.querySelectorAll("[data-dark-src]").forEach(img => {
      const darkSrc = img.getAttribute("data-dark-src");
      const defaultSrc = img.getAttribute("data-src") || img.getAttribute("src");
      img.src = isDark ? darkSrc : defaultSrc;
    });
  }

  function initDarkMode() {
    const htmlEl = document.documentElement;
    const toggleBtn = document.querySelector(".darkmode-toggle");
    const stored = localStorage.getItem("dark_mode");

    if (pbtData.isDark || stored === "true") {
      htmlEl.classList.add("is-dark");
      updateDarkLogos(true);
    }

    if (!pbtData.isDark && pbtData.userDarkMode && toggleBtn) {
      toggleBtn.addEventListener("click", function() {
        const isDark = htmlEl.classList.toggle("is-dark");
        localStorage.setItem("dark_mode", isDark ? "true" : "false");
        this.classList.toggle("dark-on", isDark);
        this.classList.toggle("dark-off", !isDark);
        updateDarkLogos(isDark);
      });
    }
  }

  // Navigation Dropdown Builder (pbtMenu)
  function initPbtMenu() {
    const menu = document.getElementById("main-menu");
    if (!menu) return;
    const links = Array.from(menu.querySelectorAll("a"));
    
    function buildSub(level, selector) {
      let curUl = null;
      for (let i = 0; i < links.length; i++) {
        const a = links[i];
        const text = a.textContent.trim();
        const nextA = links[i + 1];
        const nextText = nextA ? nextA.textContent.trim() : "";
        if (!text.startsWith("_") && nextText.startsWith("_")) {
          const parentLi = a.closest("li");
          if (parentLi) {
            curUl = document.createElement("ul");
            curUl.className = "ul sub sm-" + level;
            parentLi.appendChild(curUl);
          }
        } else if (text.startsWith("_") && curUl) {
          a.textContent = text.replace(/^_+/, "");
          const li = a.closest("li");
          if (li && li.parentElement !== curUl) {
            curUl.appendChild(li);
          }
        }
      }
    }
    buildSub(1, ".sm-1");
    buildSub(2, ".sm-2");

    menu.querySelectorAll(".sub").forEach(sub => {
      const parent = sub.closest("li");
      if (parent) parent.classList.add("has-sub");
    });
    menu.querySelectorAll(".widget").forEach(w => w.classList.add("is-ready"));
  }

  // Post HTML Helpers for getPosts
  function buildPostImage(post, type, target, size, noLink) {
    const isYt = post.thumbnail && post.thumbnail.source === "youtube";
    const ytClass = isYt ? ('<span class="yt-img' + (size ? ':x' + size : '') + '"></span>') : '';
    const thumb = '<div class="thumbnail" data-src="' + (post.thumbnail ? post.thumbnail.src : '') + '"></div>';
    const tAttr = target ? (' target="' + target + '"') : '';
    if (noLink) return '<div class="entry-thumbnail">' + thumb + ytClass + '</div>';
    return '<a class="entry-thumbnail" href="' + post.link + '"' + tAttr + '>' + thumb + ytClass + '</a>';
  }

  function buildPostTag(post) {
    if (pbtData.postCategory && post.category) {
      return '<span class="entry-tag">' + post.category + '</span>';
    }
    return '';
  }

  function buildPostTitle(post, target, noLink) {
    const tAttr = target ? (' target="' + target + '"') : '';
    if (noLink) return '<h2 class="entry-title">' + post.title + '</h2>';
    return '<h2 class="entry-title"><a href="' + post.link + '"' + tAttr + '>' + post.title + '</a></h2>';
  }

  function buildPostMeta(post, noAuthor) {
    let aStr = (!noAuthor && pbtData.postAuthor && post.author) ? ('<span class="entry-author"><span class="author-name">' + post.author + '</span></span>') : '';
    let dStr = (pbtData.postDate && post.published && post.published.date) ? ('<span class="entry-time"><time class="published" datetime="' + (post.published.datetime || '') + '">' + post.published.date + '</time></span>') : '';
    if (aStr || dStr) return '<div class="entry-meta">' + aStr + dStr + '</div>';
    return '';
  }

  function buildPostSummary(post) {
    if (pbtData.postSummary && post.summary) {
      return '<p class="entry-excerpt excerpt">' + post.summary + '</p>';
    }
    return '';
  }

  // Post Renderer for all types
  function renderPost(type, idx, post, num, headline, target) {
    const l = post.link;
    const tag = buildPostTag(post);
    const title = buildPostTitle(post, target);
    const meta = buildPostMeta(post);
    const metaNoAuthor = buildPostMeta(post, true);
    const summary = buildPostSummary(post);

    switch(type) {
      case "mega":
      case "megatabs":
        return '<div class="post fadeInDown" style="animation-delay:' + (0.1 * idx).toFixed(1) + 's;">' + buildPostImage(post, type, target, 2) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "search":
        if (idx >= num) return '';
        return '<div class="post fadeInDown" style="animation-delay:' + (0.1 * idx).toFixed(1) + 's;">' + buildPostImage(post, type, target, 4) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "featured":
        if (idx === 0) {
          return '<div class="row-0 post first"><a class="entry-inner flex-c" href="' + l + '"><div class="container">' + buildPostImage(post, type, target, 0, true) + '<div class="entry-header">' + tag + buildPostTitle(post, target, true) + meta + '</div></div></a></div>';
        }
        const openGrid = (idx === 1) ? '<div class="row-1 flex-c"><div class="container"><div class="grid">' : '';
        return openGrid + '<div class="post">' + buildPostImage(post, type, target, 4) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "grid":
      case "list":
        return '<div class="post">' + buildPostImage(post, type, target) + '<div class="entry-header">' + tag + title + summary + meta + '</div></div>';
      case "block1":
        if (idx === 0) {
          return '<div class="post first">' + buildPostImage(post, type, target) + '<div class="entry-header">' + tag + title + summary + meta + '</div></div>';
        }
        const openBlock1 = (idx === 1) ? '<div class="block1-list">' : '';
        return openBlock1 + '<div class="post">' + buildPostImage(post, type, target, 3) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "block2":
        if (idx === 0) {
          return '<div class="post card cs"><a class="entry-inner" href="' + l + '">' + buildPostImage(post, type, target, 0, true) + '<div class="entry-header">' + tag + buildPostTitle(post, target, true) + meta + '</div></a></div>';
        }
        const openBlock2 = (idx === 1) ? '<div class="block2-grid">' : '';
        return openBlock2 + '<div class="post">' + buildPostImage(post, type, target) + '<div class="entry-header">' + tag + title + summary + meta + '</div></div>';
      case "story":
        return '<div class="post card cs"><a class="entry-inner" href="' + l + '">' + buildPostImage(post, type, target, 0, true) + '<div class="entry-header">' + buildPostTitle(post, target, true) + metaNoAuthor + '</div></a></div>';
      case "video":
        if (idx === 0) {
          return '<div class="post first">' + buildPostImage(post, type, target) + '<div class="entry-header">' + tag + title + summary + meta + '</div></div>';
        }
        const openVideo = (idx === 1) ? '<div class="video-grid">' : '';
        return openVideo + '<div class="post">' + buildPostImage(post, type, target, 3) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "card":
        return buildPostImage(post, type, target, 2) + '<div class="entry-header">' + (headline || '') + title + meta + '</div>';
      case "related":
        return '<div class="post">' + buildPostImage(post, type, target, 2) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
      case "side":
      default:
        return '<div class="post">' + buildPostImage(post, type, target, 3) + '<div class="entry-header">' + title + metaNoAuthor + '</div></div>';
    }
  }

  // Core Feed Fetcher (getPosts)
  async function getPosts(params) {
    const targetEl = params.targetEl;
    if (!targetEl) return;
    const type = params.type || "grid";
    const num = parseInt(params.num, 10) || 4;
    const label = params.label || "recent";
    const id = params.id;
    const headline = params.headline;
    const target = params.target;

    let feedUrl = params.link;
    if (!feedUrl) {
      feedUrl = (label === "recent") 
        ? "/search/?by-date=true&max-results=" + num + "&view=json" 
        : "/search/label/" + encodeURIComponent(label) + "?by-date=true&max-results=" + num + "&view=json";
    }

    if (["mega", "megatabs", "card", "related"].includes(type)) {
      targetEl.innerHTML = $loader;
    } else if (type === "search") {
      targetEl.classList.remove("scroll");
      if (targetEl.parentElement && targetEl.parentElement.parentElement) {
        targetEl.parentElement.parentElement.classList.add("loading");
      }
    } else {
      targetEl.innerHTML = $loader;
      if (targetEl.parentElement) targetEl.parentElement.classList.add("type-" + type);
    }

    try {
      const res = await fetch(feedUrl);
      if (!res.ok) throw new Error("Fetch failed");
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const code = doc.getElementById("data");
      if (!code) throw new Error("No data element");

      const json = JSON.parse(code.textContent);
      let posts = (type === "card") ? json.postData : json.posts;
      if (!posts || !posts.length) throw new Error("No posts");

      if (type === "related" && id) {
        posts = posts.filter(p => p.id !== id);
      }

      let wrapperClass = type + "-items";
      if (type === "mega" || type === "megatabs") wrapperClass = "mega-items";
      if (type === "featured") wrapperClass = "featured-items cs";
      if (type === "card") wrapperClass = "post";

      let out = '<div class="' + wrapperClass + '">';
      for (let i = 0; i < posts.length && i < num; i++) {
        out += renderPost(type, i, posts[i], num, headline, target);
      }

      if (type === "featured") {
        out += "</div></div></div>";
      } else if (type === "block1" || type === "block2" || type === "video") {
        out += "</div>";
      }
      out += "</div>";

      if (type === "search") {
        targetEl.innerHTML = out;
        const p = targetEl.parentElement;
        if (p) {
          p.classList.add("visible");
          if (p.parentElement) p.parentElement.classList.remove("loading");
          let viewAll = p.querySelector(".view-all");
          if (posts.length >= num) {
            const queryUrl = "/search?q=" + encodeURIComponent(label) + "&by-date=true";
            if (viewAll) {
              viewAll.querySelector("a").setAttribute("href", queryUrl);
            } else {
              const vaDiv = document.createElement("div");
              vaDiv.className = "view-all";
              vaDiv.innerHTML = '<a class="btn" href="' + queryUrl + '">' + (pbtData.viewAll || "View All") + '</a>';
              p.appendChild(vaDiv);
            }
          } else if (viewAll) {
            viewAll.remove();
          }
        }
        setTimeout(() => targetEl.classList.add("scroll"), 400);
      } else if (type === "video") {
        targetEl.innerHTML = out;
        const firstThumb = targetEl.querySelector(".first .thumbnail");
        if (firstThumb && targetEl.parentElement) {
          const bg = firstThumb.getAttribute("data-src");
          if (bg) targetEl.parentElement.style.backgroundImage = "url('" + bg + "')";
        }
      } else {
        targetEl.innerHTML = out;
      }

      initLazy(targetEl);
    } catch(err) {
      targetEl.innerHTML = '<span class="error-msg">' + (type !== "search" ? "<b>Error:</b>&nbsp;" : "") + (pbtData.noResults || "No results found.") + '</span>';
      if (type === "search" && targetEl.parentElement && targetEl.parentElement.parentElement) {
        targetEl.parentElement.parentElement.classList.remove("loading");
      }
    }
  }

  // Mega Tabs Handler
  function initMegaTabs(el, tabs) {
    let navHtml = '<div class="nav">';
    let tabsHtml = '<div class="tabs">';
    tabs.forEach((tab, idx) => {
      if (tab && idx <= 4) {
        const active = (idx === 0) ? ' class="active"' : '';
        navHtml += '<a href="/search/label/' + tab + '"' + active + '>' + tab + '</a>';
        tabsHtml += '<div data-tab="' + tab + '"' + active + '></div>';
      }
    });
    navHtml += '</div>';
    tabsHtml += '</div>';
    const container = el.querySelector(".container");
    if (container) {
      container.innerHTML = '<div class="mega-tabs">' + navHtml + tabsHtml + '</div>';
      const aTrigger = el.querySelector("a");
      if (aTrigger) {
        aTrigger.removeAttribute("data-shortcode");
        aTrigger.addEventListener("click", e => e.preventDefault());
      }
      el.classList.add("type-tabs");

      const navLinks = container.querySelectorAll(".nav a");
      const tabDivs = container.querySelectorAll("[data-tab]");

      function loadTab(targetTab) {
        if (!targetTab.classList.contains("loaded")) {
          targetTab.classList.add("loaded");
          const tabLabel = targetTab.getAttribute("data-tab");
          getPosts({ targetEl: targetTab, type: "megatabs", num: 5, label: tabLabel });
        }
      }

      el.addEventListener("mouseenter", () => {
        const activeTab = container.querySelector("[data-tab].active");
        if (activeTab) loadTab(activeTab);
      });

      navLinks.forEach((nl, idx) => {
        nl.addEventListener("mouseenter", function() {
          navLinks.forEach(n => n.classList.remove("active"));
          tabDivs.forEach(t => t.classList.remove("active"));
          this.classList.add("active");
          const target = tabDivs[idx];
          if (target) {
            target.classList.add("active");
            loadTab(target);
          }
        });
      });
    }
  }

  // Mega Menu Initializer
  function initMegaMenu() {
    document.querySelectorAll(".main-nav .has-mega").forEach(m => {
      const a = m.querySelector("a");
      if (!a) return;
      const shortcode = a.getAttribute("data-shortcode");
      const labelAttr = getAttr(shortcode, "label") || "recent";
      const parts = labelAttr.split("/").filter(p => p.trim() !== "");
      if (labelAttr.includes("/") && parts.length > 1) {
        initMegaTabs(m, parts);
      } else {
        const lbl = parts[0] || "recent";
        const link = (lbl === "recent") ? "/search" : ("/search/label/" + lbl);
        a.setAttribute("href", link);
        a.removeAttribute("data-shortcode");
        m.classList.add("type-mega");
        m.addEventListener("mouseenter", function() {
          if (!m.classList.contains("loaded")) {
            m.classList.add("loaded");
            const cont = m.querySelector(".container");
            if (cont) getPosts({ targetEl: cont, type: "mega", num: 5, label: lbl });
          }
        });
      }
    });
  }

  // Sidebar Social Follower Counters (#2.5m -> <span class="text">2.5m</span>)
  function initSocialCounters() {
    document.querySelectorAll(".sidebar .social a").forEach(a => {
      const href = a.getAttribute("href") || "";
      const parts = href.split("#");
      const hasText = a.getAttribute("data-text");
      if (parts[1] && (hasText === "true" || hasText === "")) {
        const val = parts[1].trim();
        if (val) {
          const span = document.createElement("span");
          span.className = "text";
          span.textContent = val;
          a.appendChild(span);
        }
      }
      a.setAttribute("href", parts[0].trim());
    });
  }

  // Mailchimp Subscription Forms
  function initMailchimp() {
    document.querySelectorAll(".MailChimp").forEach(box => {
      if (opt.subscribeFormUrl) {
        const form = box.querySelector(".mailchimp-form");
        const msg = box.querySelector(".mailchimp-text");
        const btn = box.querySelector(".mailchimp-submit");
        if (msg && opt.subscribeMessage) msg.innerHTML = opt.subscribeMessage;
        if (form) {
          form.setAttribute("action", opt.subscribeFormUrl);
          form.setAttribute("onsubmit", "window.open('" + opt.subscribeFormUrl + "', 'popupwindow', 'scrollbars=yes,width=550,height=520'); return true;");
        }
        if (btn) btn.removeAttribute("disabled");
      }
    });
  }

  // Table of Contents Builder
  function initPbtToc() {
    const postBody = document.getElementById("post-body");
    const tocList = document.getElementById("pbt-toc");
    if (!postBody || !tocList) return;
    const headings = postBody.querySelectorAll("h2, h3, h4");
    if (!headings.length) return;

    tocList.innerHTML = "";
    headings.forEach((h, idx) => {
      const text = h.textContent.trim();
      if (!text) return;
      if (!h.id) {
        h.id = "section_" + (idx + 1);
      }
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = text;
      a.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 30;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      });
      li.appendChild(a);
      tocList.appendChild(li);
    });
  }

  // Shortcode Engine (Post Body)
  function initShortcodes() {
    const postBody = document.getElementById("post-body");
    if (!postBody) return;

    // Blockquote Alerts
    postBody.querySelectorAll("blockquote").forEach(bq => {
      const text = bq.textContent.trim();
      let html = bq.innerHTML;
      const alerts = [
        { shc: "{alertSuccess}", cls: "alert-message alert-success" },
        { shc: "{alertInfo}", cls: "alert-message alert-info" },
        { shc: "{alertWarning}", cls: "alert-message alert-warning" },
        { shc: "{alertError}", cls: "alert-message alert-error" },
        { shc: "{codeBox}", cls: "code-box" }
      ];
      for (let i = 0; i < alerts.length; i++) {
        if (text.includes(alerts[i].shc)) {
          html = html.replace(alerts[i].shc, "");
          const div = document.createElement(alerts[i].cls === "code-box" ? "pre" : "div");
          div.className = alerts[i].cls;
          div.innerHTML = html;
          bq.replaceWith(div);
          break;
        }
      }
    });

    // Bold Shortcodes ({getToc}, {inAds}, etc.)
    postBody.querySelectorAll("b").forEach(b => {
      const text = b.textContent.trim();
      if (text.includes("{inAds}") || text.includes("{ads}") || text.includes("$ads={1}") || text.includes("$ads={2}")) {
        const div = document.createElement("div");
        div.className = "article-ads";
        b.replaceWith(div);
      } else if (text.includes("{showAds}")) {
        b.remove();
      } else if (text.includes("{nextPage}")) {
        b.replaceWith(document.createComment("nextpage"));
      } else if (text.includes("{contactForm}")) {
        const cf = document.createElement("div");
        cf.className = "contact-form-widget";
        const orig = document.querySelector("#ContactForm1 form");
        if (orig) cf.appendChild(orig);
        b.replaceWith(cf);
      } else if (text.includes("{leftSidebar}")) {
        document.body.classList.add("is-left");
        document.body.classList.remove("is-right");
        b.remove();
      } else if (text.includes("{rightSidebar}")) {
        document.body.classList.add("is-right");
        document.body.classList.remove("is-left");
        b.remove();
      } else if (text.includes("{noSidebar}") || text.includes("{fullWidth}")) {
        document.body.classList.add("no-sidebar");
        b.remove();
      } else if (text.includes("{getToc}")) {
        const title = getAttr(text, "title") || "Table of Contents";
        const count = getAttr(text, "count") || "true";
        const exp = getAttr(text, "expanded");
        const wrap = document.createElement("div");
        wrap.className = "pbt-toc-wrap";
        wrap.innerHTML = '<div class="pbt-toc-inner"><button class="pbt-toc-title' + (exp === 'true' ? ' is-expanded' : '') + '" aria-label="' + title + '"><span class="pbt-toc-title-text">' + title + '</span></button><ol id="pbt-toc" data-count="' + count + '" style="display:' + (exp === 'true' ? 'block' : 'none') + '"></ol></div></div>';
        b.replaceWith(wrap);

        const btn = wrap.querySelector(".pbt-toc-title");
        const ol = wrap.querySelector("#pbt-toc");
        if (btn && ol) {
          btn.addEventListener("click", () => {
            btn.classList.toggle("is-expanded");
            ol.style.display = (ol.style.display === "none") ? "block" : "none";
          });
        }
        initPbtToc();
      }
    });

    // Anchor Shortcodes ({getButton}, {getCard})
    postBody.querySelectorAll("a").forEach(a => {
      const text = a.textContent.trim();
      if (text.includes("getButton")) {
        const s = getAttr(text, "text");
        const icon = getAttr(text, "icon");
        const color = getAttr(text, "color");
        const size = getAttr(text, "size");
        const info = getAttr(text, "info");
        const id = getAttr(text, "id");
        a.className = size ? "button btn x2" : "button btn";
        a.textContent = s || "Button";
        if (id) a.href = a.href + "#gd=" + btoa(id);
        if (icon) a.classList.add(icon);
        if (color) a.style.background = color;
        if (info) {
          const sp = document.createElement("span");
          sp.className = "btn-info";
          sp.textContent = info;
          a.appendChild(sp);
        }
      } else if (text.includes("getCard")) {
        const n = getAttr(text, "type");
        const title = getAttr(text, "title") || (pbtData.noTitle || "");
        const button = getAttr(text, "button");
        const icon = getAttr(text, "icon");
        const info = getAttr(text, "info");
        const id = getAttr(text, "id");
        const href = a.getAttribute("href") || "#";
        const target = a.getAttribute("target") || "_self";

        if (n === "download" || n === "product" || n === "custom") {
          const finalHref = (n === "download" && id) ? href + "#gd=" + btoa(id) : href;
          const iconCode = icon || (n === "download" ? "&#xF295;" : n === "product" ? "&#xF242;" : "&#xF4B1;");
          const cta = document.createElement("div");
          cta.className = "cta-card " + n;
          cta.innerHTML = '<div class="card-header"><div class="card-icon"><i class="bi" data-icon="' + iconCode + '"></i></div><div class="card-info"><span class="card-title">' + title + '</span>' + (info ? '<span class="card-meta">' + info + '</span>' : '') + '</div></div><a class="card-btn btn" href="' + finalHref + '" target="' + target + '">' + (button || '<i class="bi bi-box-arrow-up-right"></i>') + '</a>';
          a.replaceWith(cta);
        }
      }
    });
  }

  // Inject Ads from noscript definitions
  function initAdSlots() {
    function inject(slotId, targetSelector) {
      const src = document.getElementById(slotId);
      const targets = document.querySelectorAll(targetSelector);
      if (!src || !targets.length) return;
      const noscript = src.querySelector("noscript");
      if (!noscript) return;
      const html = noscript.textContent || noscript.innerHTML;
      targets.forEach(t => {
        t.innerHTML = '<div class="widget">' + html + '</div>';
      });
    }
    inject("post-ads-1", ".before-ads");
    inject("post-ads-2", ".after-ads");
    inject("post-ads-3", ".article-ads");
    inject("post-ads-4", ".post-footer-ads");
  }

  // Live Search Modal
  function initSearch() {
    const searchModal = document.querySelector(".main-search");
    const searchInput = searchModal ? searchModal.querySelector("input") : null;
    const searchResults = searchModal ? searchModal.querySelector(".search-results") : null;
    const searchClose = searchModal ? searchModal.querySelector(".close") : null;
    const overlayBg = document.querySelector(".overlay-bg");

    function open() {
      document.body.classList.add("search-on");
      if (searchInput) setTimeout(() => searchInput.focus(), 250);
    }

    function close() {
      document.body.classList.remove("search-on");
      if (searchInput) { searchInput.blur(); searchInput.value = ""; }
      if (searchResults) {
        searchResults.innerHTML = "";
        searchResults.classList.remove("scroll");
        if (searchResults.parentElement) searchResults.parentElement.classList.remove("visible");
      }
    }

    document.querySelectorAll(".search-toggle").forEach(b => b.addEventListener("click", open));
    if (searchClose) searchClose.addEventListener("click", close);
    if (overlayBg) overlayBg.addEventListener("click", () => {
      if (document.body.classList.contains("search-on")) close();
    });

    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && document.body.classList.contains("search-on")) close();
      if (e.ctrlKey && (e.key === "k" || e.key === "K")) { e.preventDefault(); open(); }
    });

    let debounce;
    if (searchInput && searchResults) {
      searchInput.addEventListener("input", function() {
        clearTimeout(debounce);
        const q = this.value.trim();
        if (!q) {
          searchResults.innerHTML = "";
          searchResults.classList.remove("scroll");
          if (searchResults.parentElement) searchResults.parentElement.classList.remove("visible");
          return;
        }
        debounce = setTimeout(() => {
          getPosts({
            targetEl: searchResults,
            type: "search",
            num: 4,
            label: q,
            link: "/search/?q=" + encodeURIComponent(q) + "&max-results=5&view=json"
          });
        }, 350);
      });
    }
  }

  // Social Share Modal & Clipboard Copy
  function initShareModal() {
    const shareModal = document.querySelector(".share-modal");
    const overlayBg = document.querySelector(".overlay-bg");
    const hideBtn = document.querySelector(".hide-modal");

    function open() { document.body.classList.add("share-on"); }
    function close() { document.body.classList.remove("share-on"); }

    document.querySelectorAll(".share-toggle, .post-share .show-more button").forEach(b => b.addEventListener("click", open));
    if (hideBtn) hideBtn.addEventListener("click", close);

    document.querySelectorAll(".window-open").forEach(w => {
      w.addEventListener("click", function(e) {
        e.preventDefault();
        window.open(this.href, "_blank", "scrollbars=yes,resizable=yes,toolbar=0,width=860,height=540,top=50,left=50");
      });
    });

    document.querySelectorAll(".copy-link").forEach(box => {
      const input = box.querySelector("input");
      const btn = box.querySelector("button");
      if (input && btn) {
        input.addEventListener("click", () => input.select());
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(input.value).then(() => {
            box.classList.remove("copied-off");
            box.classList.add("copied");
            setTimeout(() => {
              box.classList.remove("copied");
              box.classList.add("copied-off");
            }, 3000);
          });
        });
      }
    });
  }

  // Mobile Drawer Menu
  function initMobileMenu() {
    const mobileLogo = document.querySelector(".mobile-logo");
    const mainLogoLink = document.querySelector(".main-logo a");
    if (mobileLogo && mainLogoLink) {
      const clonedLogo = mainLogoLink.cloneNode(true);
      const h1 = clonedLogo.querySelector("h1");
      if (h1) h1.remove();
      mobileLogo.appendChild(clonedLogo);
    }

    const mobileMenuCont = document.querySelector(".mobile-menu");
    const mainNav = document.querySelector(".main-nav");
    if (mobileMenuCont && mainNav) {
      const clonedNav = mainNav.cloneNode(true);
      clonedNav.className = "mobile-nav";
      clonedNav.querySelectorAll(".type-mega").forEach(m => {
        m.className = "";
        const ul = m.querySelector(".ul");
        if (ul) ul.remove();
      });
      mobileMenuCont.appendChild(clonedNav);

      document.querySelectorAll(".menu-toggle, .hide-mobile-menu").forEach(b => {
        b.addEventListener("click", () => document.body.classList.toggle("menu-on"));
      });

      const overlay = document.querySelector(".overlay-bg");
      if (overlay) {
        overlay.addEventListener("click", () => document.body.classList.remove("menu-on"));
      }

      clonedNav.querySelectorAll(".has-sub > a").forEach(subLink => {
        subLink.addEventListener("click", function(e) {
          e.preventDefault();
          const parent = this.parentElement;
          const sub = parent.querySelector(".sub");
          if (sub) {
            const isExp = parent.classList.toggle("expanded");
            sub.style.display = isExp ? "block" : "none";
          }
        });
      });
    }

    const mmFooter = document.querySelector(".mm-footer");
    const footerSocial = document.querySelector(".footer-info .social");
    const footerMenuUl = document.querySelector(".footer-menu ul");
    if (mmFooter) {
      if (footerSocial) {
        const cSocial = footerSocial.cloneNode(true);
        cSocial.className = "social color";
        cSocial.querySelectorAll(".text").forEach(t => t.remove());
        mmFooter.appendChild(cSocial);
      }
      if (footerMenuUl) {
        const cLinks = footerMenuUl.cloneNode(true);
        cLinks.className = "links";
        mmFooter.appendChild(cLinks);
      }
    }
  }

  // Sticky Header
  function initStickyHeader() {
    if (!pbtData.stickyMenu) return;
    const header = document.querySelector(".header-inner");
    const mainHeader = document.querySelector(".main-header");
    if (!header || !mainHeader) return;

    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const curY = window.scrollY;
      const threshold = mainHeader.offsetHeight * 2;
      if (curY > threshold) {
        header.classList.add("is-fixed");
        if (curY < lastY) header.classList.add("show");
        else header.classList.remove("show");
      } else {
        header.classList.remove("is-fixed", "show");
      }
      lastY = curY;
    }, { passive: true });
  }

  // Back to Top Button
  function initBackToTop() {
    const btn = document.querySelector(".to-top");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) btn.classList.add("show");
      else btn.classList.remove("show");
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // AJAX Pagination (#load-more)
  function initAjaxPagination() {
    const btn = document.getElementById("load-more");
    if (!btn) return;
    const loading = document.querySelector(".blog-pager .loading");
    const noMore = document.querySelector(".blog-pager .no-more");
    const container = document.querySelector(".blog-posts");

    let nextUrl = btn.getAttribute("data-url");
    btn.addEventListener("click", async function(e) {
      e.preventDefault();
      if (!nextUrl) return;
      btn.classList.remove("visible");
      if (loading) loading.classList.add("visible");

      try {
        const res = await fetch(nextUrl);
        if (!res.ok) throw new Error("Load more failed");
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newPosts = doc.querySelectorAll(".blog-posts .post");

        if (newPosts.length && container) {
          newPosts.forEach((p, idx) => {
            p.classList.add("fadeInUp");
            p.style.animationDelay = (0.1 * idx).toFixed(1) + "s";
            container.appendChild(p);
          });
          initLazy(container);
        }

        const nextBtn = doc.getElementById("load-more");
        if (nextBtn && nextBtn.getAttribute("data-url")) {
          nextUrl = nextBtn.getAttribute("data-url");
          btn.setAttribute("data-url", nextUrl);
          btn.classList.add("visible");
        } else {
          nextUrl = null;
          if (noMore) noMore.classList.add("visible");
        }
      } catch(err) {
        if (noMore) noMore.classList.add("visible");
      } finally {
        if (loading) loading.classList.remove("visible");
      }
    });
  }

  // Auto Alt for Post Images
  function initImageAlt() {
    const postTitle = (document.title || "").split(" | ")[0].trim();
    document.querySelectorAll(".post-body img").forEach(img => {
      if (!img.alt || img.alt.trim() === "") {
        img.alt = postTitle;
        img.title = postTitle;
      }
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });
  }

  // Lazy-load Async Widgets with IntersectionObserver
  function initAsyncWidgets() {
    const widgetObs = ("IntersectionObserver" in window) ? new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          loadWidget(entry.target);
        }
      });
    }, { rootMargin: "300px 0px" }) : null;

    function loadWidget(target) {
      const shortcode = target.getAttribute("data-shortcode");
      if (!shortcode) return;
      const results = getAttr(shortcode, "results");
      const label = getAttr(shortcode, "label") || "recent";
      const type = getAttr(shortcode, "type") || "block1";
      const num = results ? parseInt(results, 10) : (type === "block2" ? 5 : 4);

      getPosts({ targetEl: target, type: type, num: num, label: label });
      target.removeAttribute("data-shortcode");
    }

    document.querySelectorAll(".content-section .getPosts .widget-content, .sidebar .getPosts .widget-content, .footer .getPosts .widget-content").forEach(w => {
      if (widgetObs) widgetObs.observe(w);
      else loadWidget(w);
    });

    // Related Posts in article footer
    const relatedWrap = document.querySelector(".related-wrap");
    if (relatedWrap) {
      const tag = relatedWrap.querySelector(".related-tag");
      const content = relatedWrap.querySelector(".widget-content");
      if (tag && content) {
        const id = tag.getAttribute("data-id");
        const label = tag.getAttribute("data-label") || "recent";
        const obs = ("IntersectionObserver" in window) ? new IntersectionObserver((entries, o) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              o.unobserve(entry.target);
              getPosts({ targetEl: content, type: "related", num: 4, label: label, id: id });
            }
          });
        }, { rootMargin: "250px 0px" }) : null;
        if (obs) obs.observe(content);
        else getPosts({ targetEl: content, type: "related", num: 4, label: label, id: id });
      }
    }
  }

  // Cookie Consent Banner
  function initCookieConsent() {
    const banner = document.querySelector(".cookie-consent");
    if (!banner) return;
    const btn = banner.querySelector(".consent-button");
    if (Cookies.get("cookie_consent") !== "true") {
      banner.style.display = "block";
      setTimeout(() => banner.classList.add("visible"), 50);
    }
    if (btn) {
      btn.addEventListener("click", () => {
        Cookies.set("cookie_consent", "true", 365);
        banner.classList.remove("visible");
        setTimeout(() => banner.style.display = "none", 400);
      });
    }
  }

  // Bootstrap All Functions
  function init() {
    initPbtMenu();
    initDarkMode();
    initSearch();
    initShortcodes();
    initAdSlots();
    initShareModal();
    initMobileMenu();
    initStickyHeader();
    initBackToTop();
    initSocialCounters();
    initMailchimp();
    initMegaMenu();
    initAjaxPagination();
    initAsyncWidgets();
    initImageAlt();
    initCookieConsent();
    initLazy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
