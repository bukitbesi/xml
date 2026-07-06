(() => {
  'use strict';

  const ROOT_SELECTOR = '[data-tbb-directory]';

  class TbbDirectory {
    constructor(root) {
      this.root = root;
      this.dataUrl = root.dataset.source;
      this.category = root.dataset.category || '';
      this.state = root.dataset.state || '';
      this.records = [];
      this.filtered = [];
      this.stateEl = root.querySelector('[data-dir-state]');
      this.districtEl = root.querySelector('[data-dir-district]');
      this.searchEl = root.querySelector('[data-dir-search]');
      this.resultsEl = root.querySelector('[data-dir-results]');
      this.countEl = root.querySelector('[data-dir-count]');
      this.statusEl = root.querySelector('[data-dir-status]');
      this.clearEl = root.querySelector('[data-dir-clear]');
      this.template = root.querySelector('template[data-dir-card]');
    }

    async init() {
      if (!this.dataUrl || !this.resultsEl || !this.template) {
        this.setStatus('Konfigurasi direktori tidak lengkap.', 'error');
        return;
      }

      this.bind();
      this.restoreFromUrl();
      this.setStatus('Memuatkan lokasi…', 'loading');

      try {
        const response = await fetch(this.dataUrl, { credentials: 'omit', cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        this.records = Array.isArray(payload.items) ? payload.items : [];
        this.meta = payload.meta || {};
        this.populateFilters();
        this.applyFilters();
      } catch (error) {
        console.error('[TBB Directory]', error);
        this.setStatus('Data lokasi gagal dimuatkan. Cuba semula sebentar lagi.', 'error');
      }
    }

    bind() {
      const update = () => this.applyFilters(true);
      this.searchEl?.addEventListener('input', this.debounce(update, 180));
      this.stateEl?.addEventListener('change', update);
      this.districtEl?.addEventListener('change', update);
      this.clearEl?.addEventListener('click', () => {
        if (this.searchEl) this.searchEl.value = '';
        if (this.stateEl) this.stateEl.value = this.state;
        if (this.districtEl) this.districtEl.value = '';
        this.applyFilters(true);
        this.searchEl?.focus();
      });

      this.resultsEl?.addEventListener('click', async (event) => {
        const copyButton = event.target.closest('[data-copy-address]');
        if (!copyButton) return;
        const address = copyButton.dataset.copyAddress || '';
        if (!address) return;
        try {
          await navigator.clipboard.writeText(address);
          const old = copyButton.textContent;
          copyButton.textContent = 'Disalin';
          setTimeout(() => { copyButton.textContent = old; }, 1400);
        } catch {
          window.prompt('Salin alamat ini:', address);
        }
      });
    }

    restoreFromUrl() {
      const params = new URLSearchParams(location.search);
      if (this.searchEl && params.has('q')) this.searchEl.value = params.get('q');
      if (this.stateEl && params.has('negeri')) this.stateEl.dataset.pending = params.get('negeri');
      if (this.districtEl && params.has('daerah')) this.districtEl.dataset.pending = params.get('daerah');
    }

    populateFilters() {
      const states = [...new Set(this.records.map(item => item.state).filter(Boolean))].sort(this.localeSort);
      const districts = [...new Set(this.records.map(item => item.district).filter(Boolean))].sort(this.localeSort);

      this.fillSelect(this.stateEl, states, 'Semua negeri');
      this.fillSelect(this.districtEl, districts, 'Semua daerah');

      const pendingState = this.stateEl?.dataset.pending || this.state;
      const pendingDistrict = this.districtEl?.dataset.pending || '';
      if (this.stateEl && states.includes(pendingState)) this.stateEl.value = pendingState;
      if (this.districtEl && districts.includes(pendingDistrict)) this.districtEl.value = pendingDistrict;
    }

    fillSelect(select, values, label) {
      if (!select) return;
      const current = select.value;
      select.replaceChildren(new Option(label, ''));
      values.forEach(value => select.add(new Option(value, value)));
      if (values.includes(current)) select.value = current;
    }

    applyFilters(updateUrl = false) {
      const query = this.normalize(this.searchEl?.value || '');
      const state = this.stateEl?.value || this.state;
      const district = this.districtEl?.value || '';

      this.filtered = this.records.filter(item => {
        if (this.category && item.category !== this.category) return false;
        if (state && item.state !== state) return false;
        if (district && item.district !== district) return false;
        if (!query) return true;
        const haystack = this.normalize([
          item.name, item.branchType, item.address, item.city, item.district,
          item.state, item.postcode, ...(item.services || [])
        ].filter(Boolean).join(' '));
        return haystack.includes(query);
      }).sort((a, b) => this.localeSort(a.name, b.name));

      this.render();
      if (updateUrl) this.syncUrl(query, state, district);
    }

    render() {
      this.resultsEl.replaceChildren();
      if (this.countEl) this.countEl.textContent = String(this.filtered.length);

      if (!this.filtered.length) {
        this.setStatus('Tiada lokasi sepadan. Cuba nama bandar, poskod atau daerah lain.', 'empty');
        return;
      }

      const fragment = document.createDocumentFragment();
      this.filtered.forEach(item => fragment.append(this.renderCard(item)));
      this.resultsEl.append(fragment);
      this.setStatus(`${this.filtered.length} lokasi ditemui.`, 'success');
    }

    renderCard(item) {
      const node = this.template.content.firstElementChild.cloneNode(true);
      this.text(node, '[data-field="name"]', item.name);
      this.text(node, '[data-field="type"]', item.branchType || 'Lokasi');
      this.text(node, '[data-field="address"]', item.address || 'Alamat sedang disahkan');
      this.text(node, '[data-field="district"]', [item.district, item.state].filter(Boolean).join(', '));
      this.text(node, '[data-field="hours"]', this.formatHours(item.hours));
      this.text(node, '[data-field="verified"]', item.lastVerified ? `Disemak ${item.lastVerified}` : 'Belum disahkan');

      const phone = node.querySelector('[data-action="phone"]');
      this.setLink(phone, item.phone ? `tel:${item.phone.replace(/\s+/g, '')}` : '', item.phone || 'Telefon belum disahkan');

      const maps = node.querySelector('[data-action="maps"]');
      const mapQuery = item.mapsQuery || [item.name, item.address, item.state].filter(Boolean).join(', ');
      this.setLink(maps, mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : '', 'Arah');

      const source = node.querySelector('[data-action="source"]');
      this.setLink(source, item.sourceUrl || '', 'Sumber rasmi');

      const copy = node.querySelector('[data-copy-address]');
      if (copy) {
        copy.dataset.copyAddress = item.address || '';
        copy.hidden = !item.address;
      }

      const badge = node.querySelector('[data-field="status"]');
      if (badge) {
        badge.textContent = item.verificationStatus === 'verified' ? 'Disahkan' : item.verificationStatus === 'partial' ? 'Separa disahkan' : 'Semakan diperlukan';
        badge.dataset.status = item.verificationStatus || 'pending';
      }

      const services = node.querySelector('[data-field="services"]');
      if (services) {
        (item.services || []).forEach(service => {
          const li = document.createElement('li');
          li.textContent = service;
          services.append(li);
        });
        services.hidden = !(item.services || []).length;
      }

      return node;
    }

    formatHours(hours) {
      if (!hours) return 'Waktu operasi sedang disahkan';
      if (typeof hours === 'string') return hours;
      return Object.entries(hours).map(([day, value]) => `${day}: ${value}`).join(' · ');
    }

    text(root, selector, value) {
      const element = root.querySelector(selector);
      if (element) element.textContent = value || '';
    }

    setLink(element, href, text) {
      if (!element) return;
      element.textContent = text;
      if (href) {
        element.href = href;
        element.hidden = false;
        if (/^https?:/.test(href)) {
          element.target = '_blank';
          element.rel = 'noopener noreferrer';
        }
      } else {
        element.removeAttribute('href');
        element.hidden = true;
      }
    }

    setStatus(message, type) {
      if (!this.statusEl) return;
      this.statusEl.textContent = message;
      this.statusEl.dataset.type = type;
    }

    syncUrl(query, state, district) {
      const params = new URLSearchParams(location.search);
      query ? params.set('q', this.searchEl.value.trim()) : params.delete('q');
      state ? params.set('negeri', state) : params.delete('negeri');
      district ? params.set('daerah', district) : params.delete('daerah');
      const next = `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`;
      history.replaceState(null, '', next);
    }

    normalize(value) {
      return String(value).toLocaleLowerCase('ms-MY').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }

    localeSort(a, b) {
      return String(a).localeCompare(String(b), 'ms-MY', { sensitivity: 'base' });
    }

    debounce(fn, wait) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    }
  }

  document.querySelectorAll(ROOT_SELECTOR).forEach(root => new TbbDirectory(root).init());
})();
