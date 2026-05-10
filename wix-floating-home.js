const floatingHomeAssetBase = (() => {
  const script = document.currentScript;
  if (script && script.src) return new URL('.', script.src).href;
  return 'https://srikarsmile.github.io/floting/';
})();

class FloatingHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.assetBase = floatingHomeAssetBase;
    this.version = '20260510-9';
    this.isolationTimer = 0;
    this.isolationObserver = null;
  }

  connectedCallback() {
    this.prepareWixHost();
    this.render();
    this.scheduleWixIsolation();
  }

  disconnectedCallback() {
    if (this.isolationObserver) {
      this.isolationObserver.disconnect();
      this.isolationObserver = null;
    }

    if (this.isolationTimer) {
      window.clearTimeout(this.isolationTimer);
      this.isolationTimer = 0;
    }
  }

  asset(path) {
    const cleanPath = String(path).replace(/^\/+/, '');
    return `${this.assetBase}${cleanPath}?v=${this.version}`;
  }

  async render() {
    const root = this.shadowRoot;

    root.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
          background: #f4efe3;
          color: #1f3937;
          contain: content;
        }

        .floating-loader {
          min-height: 520px;
          display: grid;
          place-items: center;
          padding: 48px;
          color: #0a5651;
          background: #f4efe3;
          font: 600 16px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .floating-error {
          min-height: 420px;
          padding: 48px;
          color: #0a2a28;
          background: #f4efe3;
          font: 500 16px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      </style>
      <div class="floating-loader">Loading Floating Counselling...</div>
    `;

    try {
      const response = await fetch(this.asset('index.html'), { mode: 'cors' });
      if (!response.ok) throw new Error(`Could not load index.html (${response.status})`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const bodyHtml = doc.body ? doc.body.innerHTML : '';

      root.innerHTML = `
        <link rel="stylesheet" href="${this.asset('styles.css')}">
        <style>
          :host {
            display: block;
            width: 100%;
            min-height: 100vh;
            background: #f4efe3;
            color: #1f3937;
            font-family: "Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          :host,
          .floating-root {
            --clr-primary: #0A5651;
            --clr-primary-soft: #0F8F86;
            --clr-primary-deep: #063836;
            --clr-brand: #0CA89C;
            --clr-brand-soft: #6CB4B4;
            --clr-mist: #C7DDDA;
            --clr-accent: #C46A4A;
            --clr-accent-soft: #E0A48A;
            --clr-accent-warm: #C46A4A;
            --clr-sage: #A8CCCC;
            --clr-bg: #F4EFE3;
            --clr-bg-warm: #ECE4D2;
            --clr-bg-deep: #E1D7BF;
            --clr-white: #FBF7EE;
            --clr-ink: #0A2A28;
            --clr-text: #1F3937;
            --clr-text-light: #5E6F6D;
            --clr-text-muted: #97A4A2;
            --clr-line: rgba(10,86,81,0.10);
            --font-body: "Inter Tight", system-ui, -apple-system, sans-serif;
            --font-display: "Bricolage Grotesque", "Inter Tight", system-ui, sans-serif;
            --fs-display: clamp(2.75rem, 6vw, 5.25rem);
            --fs-h1: clamp(2.5rem, 5vw, 4.25rem);
            --fs-h2: clamp(1.9rem, 3.4vw, 3rem);
            --fs-h3: clamp(1.15rem, 1.4vw, 1.4rem);
            --fs-lede: clamp(1.02rem, 1.15vw, 1.18rem);
            --fs-body: 1rem;
            --fs-small: 0.86rem;
            --fs-eyebrow: 0.72rem;
            --s-1: 4px;
            --s-2: 8px;
            --s-3: 12px;
            --s-4: 16px;
            --s-5: 20px;
            --s-6: 24px;
            --s-7: 32px;
            --s-8: 40px;
            --s-9: 48px;
            --s-10: 64px;
            --s-11: 80px;
            --s-12: 120px;
            --radius-sm: 10px;
            --radius: 18px;
            --radius-lg: 28px;
            --shadow-soft: 0 6px 24px -8px rgba(20,36,27,0.10);
            --shadow: 0 14px 40px -16px rgba(20,36,27,0.18);
            --shadow-float: 0 30px 80px -28px rgba(20,36,27,0.35);
            --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
            --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
            --t-fast: 0.25s;
            --t-mid: 0.5s;
            --t-slow: 0.9s;
          }

          .floating-root {
            font-family: var(--font-body, "Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
            font-size: var(--fs-body, 1rem);
            font-weight: 400;
            letter-spacing: -0.005em;
            color: var(--clr-text, #1f3937);
            background: var(--clr-bg, #f4efe3);
            line-height: 1.65;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            position: relative;
            isolation: isolate;
          }

          .floating-root *,
          .floating-root *::before,
          .floating-root *::after {
            box-sizing: border-box;
          }

          .floating-root [data-fade],
          .floating-root [data-stagger] > *,
          .floating-root [data-card] {
            opacity: 1 !important;
            transform: none !important;
          }

          .floating-root .scroll-progress,
          .floating-root .cursor-dot,
          .floating-root .cursor-ring {
            display: none !important;
          }

          .floating-root .navbar,
          .floating-root .donate-fab,
          .floating-root .back-to-top,
          .floating-root .cookie-banner,
          .floating-root .skip-link {
            position: absolute;
          }

          .floating-root .navbar {
            top: 0;
            background: rgba(244,239,227,0.97);
          }

          .floating-root .donate-fab,
          .floating-root .back-to-top {
            display: none !important;
          }

          ${this.isWixEditorPreview() ? `
          :host,
          .floating-root {
            background: var(--clr-primary-deep, #063836) !important;
          }

          .floating-root .hero,
          .floating-root .section:not(.section--dark):not(.section--cream):not(.section--cream-deep):not(.section--book):not(.section--contact) {
            background: var(--clr-bg, #f4efe3) !important;
          }

          .floating-root .section--cream {
            background: var(--clr-bg-warm, #ece4d2) !important;
          }

          .floating-root .section--contact {
            background: var(--clr-bg, #f4efe3) !important;
          }

          .floating-root .section--cream-deep {
            background: var(--clr-bg-deep, #e1d7bf) !important;
          }

          .floating-root .footer {
            background: var(--clr-primary-deep, #063836) !important;
          }
          ` : ''}
        </style>
        <div class="floating-root">${bodyHtml}</div>
      `;

      this.rewriteLocalAssets();
      this.finalizeContent();
      this.bindInteractions();
      this.scheduleWixIsolation();
    } catch (error) {
      root.innerHTML = `
        <div class="floating-error">
          <strong>Floating Counselling could not load.</strong><br>
          ${this.escapeHtml(error.message)}
        </div>
      `;
    }
  }

  prepareWixHost() {
    this.setAttribute('data-floating-home-host', 'true');
    this.style.setProperty('display', 'block', 'important');
    this.style.setProperty('position', 'relative', 'important');
    this.style.setProperty('z-index', '1', 'important');
    this.style.setProperty('box-sizing', 'border-box', 'important');
    this.style.setProperty('left', 'auto', 'important');
    this.style.setProperty('right', 'auto', 'important');
    this.style.setProperty('margin-left', '0', 'important');
    this.style.setProperty('margin-right', '0', 'important');
    this.style.setProperty('margin-top', '0', 'important');

    if (this.isWixEditorPreview()) {
      this.style.setProperty('width', '100%', 'important');
      this.style.setProperty('max-width', '100%', 'important');
      this.style.setProperty('min-height', '720px', 'important');
      this.style.setProperty('overflow', 'hidden', 'important');
      this.style.setProperty('contain', 'content', 'important');
      return;
    }

    this.style.setProperty('width', '100%', 'important');
    this.style.setProperty('max-width', 'none', 'important');
    this.style.setProperty('min-height', '100vh', 'important');
    this.style.setProperty('overflow', 'visible', 'important');
    this.style.setProperty('contain', 'none', 'important');
    this.fitWixViewport();
  }

  isWixEditorPreview() {
    const href = window.location.href || '';

    return /CustomElementPreviewIframe|editor-elements-library|editor\.wix\.com|\/html\/editor\//i.test(href);
  }

  fitWixViewport() {
    if (!this.isConnected || this.isWixEditorPreview()) return;

    const viewportWidth = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0,
    );

    if (!viewportWidth) return;

    const rect = this.getBoundingClientRect();
    const currentMarginLeft = Number.parseFloat(this.style.marginLeft) || 0;
    const currentMarginTop = Number.parseFloat(this.style.marginTop) || 0;
    const naturalLeft = rect.left - currentMarginLeft + (window.scrollX || 0);
    const naturalTop = rect.top - currentMarginTop + (window.scrollY || 0);
    const topOffset = naturalTop > 0 && naturalTop < 640 ? -naturalTop : 0;

    this.style.setProperty('width', `${viewportWidth}px`, 'important');
    this.style.setProperty('max-width', `${viewportWidth}px`, 'important');
    this.style.setProperty('margin-left', `${-naturalLeft}px`, 'important');
    this.style.setProperty('margin-top', `${topOffset}px`, 'important');

    const root = this.shadowRoot && this.shadowRoot.querySelector('.floating-root');
    if (root) {
      root.style.setProperty('width', '100%', 'important');
      root.style.setProperty('max-width', '100%', 'important');
      root.style.setProperty('overflow-x', 'hidden', 'important');
    }

    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
  }

  scheduleWixIsolation() {
    if (this.isWixEditorPreview()) {
      this.isolateEditorLegacyWixLayout();

      [80, 350, 900, 1800].forEach((delay) => {
        window.setTimeout(() => this.isolateEditorLegacyWixLayout(), delay);
      });

      return;
    }

    this.isolateFromWixLayout();

    [60, 250, 900, 1800, 3200].forEach((delay) => {
      window.setTimeout(() => this.isolateFromWixLayout(), delay);
    });

    if (!this.isolationObserver && document.body) {
      this.isolationObserver = new MutationObserver(() => {
        if (this.isolationTimer) window.clearTimeout(this.isolationTimer);
        this.isolationTimer = window.setTimeout(() => {
          this.isolationTimer = 0;
          this.isolateFromWixLayout();
        }, 80);
      });

      this.isolationObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  isolateFromWixLayout() {
    if (!this.isConnected || this.isWixEditorPreview()) return;

    this.prepareWixHost();

    const path = [];
    let current = this;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.body &&
      current !== document.documentElement &&
      path.length < 40
    ) {
      path.push(current);
      current = current.parentElement;
    }

    path.forEach((node, index) => {
      const childToKeep = index === 0 ? this : path[index - 1];
      this.expandWixLayoutNode(node);

      Array.from(node.children || []).forEach((child) => {
        if (child !== childToKeep && !child.contains(this)) {
          this.hideLegacyWixNode(child);
        }
      });
    });

    this.fitWixViewport();
  }

  isolateEditorLegacyWixLayout() {
    if (!this.isConnected) return;

    this.prepareWixHost();

    const path = [];
    let current = this;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.body &&
      current !== document.documentElement &&
      path.length < 32
    ) {
      path.push(current);
      current = current.parentElement;
    }

    path.forEach((node, index) => {
      const childToKeep = index === 0 ? this : path[index - 1];

      Array.from(node.children || []).forEach((child) => {
        if (child !== childToKeep && !child.contains(this)) {
          this.hideLegacyWixNode(child);
        }
      });
    });

    const root = this.shadowRoot && this.shadowRoot.querySelector('.floating-root');
    if (root) {
      root.style.setProperty('width', '100%', 'important');
      root.style.setProperty('max-width', '100%', 'important');
      root.style.setProperty('overflow-x', 'hidden', 'important');
    }
  }

  expandWixLayoutNode(node) {
    if (!node || node === document.body || node === document.documentElement) return;

    node.style.setProperty('width', '100%', 'important');
    node.style.setProperty('max-width', 'none', 'important');
    node.style.setProperty('min-height', '0', 'important');
    node.style.setProperty('height', 'auto', 'important');
    node.style.setProperty('overflow', 'visible', 'important');
    node.style.setProperty('padding-left', '0', 'important');
    node.style.setProperty('padding-right', '0', 'important');

    if (node !== this) {
      node.style.setProperty('margin-left', '0', 'important');
      node.style.setProperty('margin-right', '0', 'important');
    }
  }

  hideLegacyWixNode(node) {
    if (!node || node === this || node.contains(this)) return;

    node.setAttribute('data-floating-home-hidden', 'true');
    node.setAttribute('aria-hidden', 'true');
    node.style.setProperty('display', 'none', 'important');
    node.style.setProperty('visibility', 'hidden', 'important');
    node.style.setProperty('pointer-events', 'none', 'important');
    node.style.setProperty('height', '0', 'important');
    node.style.setProperty('min-height', '0', 'important');
    node.style.setProperty('overflow', 'hidden', 'important');
  }

  rewriteLocalAssets() {
    this.shadowRoot.querySelectorAll('[src]').forEach((node) => {
      const source = node.getAttribute('src');
      if (source && /^(images|\.\/images)\//.test(source)) {
        node.setAttribute('src', this.asset(source.replace(/^\.\//, '')));
      }
    });
  }

  finalizeContent() {
    const root = this.shadowRoot;
    const year = root.getElementById('footerYear');
    if (year) year.textContent = String(new Date().getFullYear());

    root.querySelectorAll('.counter').forEach((counter) => {
      const target = Number.parseInt(counter.dataset.target || '0', 10);
      const suffix = counter.dataset.suffix || '';
      counter.textContent = `${target.toLocaleString()}${suffix}`;
    });

    const cookieBanner = root.getElementById('cookieBanner');
    if (cookieBanner) cookieBanner.hidden = true;
  }

  bindInteractions() {
    const root = this.shadowRoot;

    root.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href.length < 2) return;

        const target = root.querySelector(href);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    const navToggle = root.getElementById('navToggle');
    const navLinks = root.getElementById('navLinks');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isOpen = navToggle.classList.toggle('open');
        navLinks.classList.toggle('open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navToggle.classList.remove('open');
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const faqItems = root.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });

    const contactForm = root.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = contactForm.querySelector('[data-status]');
        const requiredFields = contactForm.querySelectorAll('[required]');
        const isValid = Array.from(requiredFields).every((field) => {
          if (field.type === 'checkbox') return field.checked;
          return field.value && field.value.trim();
        });

        if (status) {
          status.textContent = isValid
            ? "Thanks - your message is ready. Please email info@floatingcounselling.co.uk if you do not hear back within two working days."
            : 'Please complete all required fields.';
          status.dataset.state = isValid ? 'ok' : 'error';
        }

        if (isValid) contactForm.reset();
      });
    }
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

customElements.define('floating-home', FloatingHome);
