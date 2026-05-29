const floatingHomeRuntimeManifest = (() => {
  try {
    return window.FloatingHomeManifest || {};
  } catch (error) {
    return {};
  }
})();

const floatingHomeDefaultAssetBase = 'https://floting.vercel.app/';

const floatingHomeAssetBase = (() => {
  const manifestAssetBase = String(floatingHomeRuntimeManifest.assetBase || '').trim();
  if (manifestAssetBase) {
    try {
      return new URL(manifestAssetBase).href;
    } catch (error) {
      return floatingHomeDefaultAssetBase;
    }
  }

  const script = document.currentScript;
  if (script && script.src) {
    try {
      const scriptUrl = new URL(script.src);
      if (scriptUrl.hostname === 'srikarsmile.github.io') {
        return floatingHomeDefaultAssetBase;
      }
      return new URL('.', script.src).href;
    } catch (error) {
      return floatingHomeDefaultAssetBase;
    }
  }

  return floatingHomeDefaultAssetBase;
})();

const floatingHomeCurrentBuild = String(floatingHomeRuntimeManifest.version || '20260529-07');

class FloatingHome extends HTMLElement {
  static get observedAttributes() {
    return ['data-cms', 'data-floating-build', 'data-floating-asset-base'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.assetBase = floatingHomeAssetBase;
    this.version = floatingHomeCurrentBuild;
    this.isolationTimer = 0;
    this.isolationObserver = null;
    this.layoutWatchdog = 0;
    this.translationClientPromise = null;
    this.cmsData = null;
    this.hasRendered = false;
    this.supportFabScrollHandler = null;
    this.boundRepairWixLayout = () => {
      if (!this.isConnected || this.isWixEditorPreview()) return;
      this.hideExternalNoise();
      this.isolateFromWixLayout();
    };
  }

  connectedCallback() {
    this.classList.remove('is-ready');
    this.readAssetBase();
    this.readBuildVersion();
    this.installGlobalGuards();
    this.preloadCriticalAssets();
    this.prepareWixHost();
    this.readCmsAttribute();
    this.render();
    this.scheduleWixIsolation();
    this.startWixLayoutWatchdog();
  }

  attributeChangedCallback(name, previousValue, nextValue) {
    if (previousValue === nextValue) return;

    if (name === 'data-floating-build') {
      const previousVersion = this.version;

      this.readBuildVersion();

      if (this.hasRendered && this.version !== previousVersion) {
        this.hasRendered = false;
        this.classList.remove('is-ready');
        this.render();
      }

      return;
    }

    if (name === 'data-floating-asset-base') {
      const previousAssetBase = this.assetBase;

      this.readAssetBase();

      if (this.hasRendered && this.assetBase !== previousAssetBase) {
        this.hasRendered = false;
        this.classList.remove('is-ready');
        this.render();
      }

      return;
    }

    if (name !== 'data-cms') return;

    this.readCmsAttribute();
    if (this.hasRendered) {
      this.applyCmsData();
      this.finalizeContent();
      this.bindInteractions();
    }
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

    this.stopWixLayoutWatchdog();
    this.stopSupportFabWatcher();
  }

  asset(path) {
    const cleanPath = String(path).replace(/^\/+/, '');
    return `${this.assetBase}${cleanPath}?v=${this.version}`;
  }

  readAssetBase() {
    const attributeAssetBase = String(this.getAttribute('data-floating-asset-base') || '').trim();

    if (!attributeAssetBase) {
      return;
    }

    try {
      this.assetBase = new URL(attributeAssetBase).href;
    } catch (error) {
      this.assetBase = floatingHomeAssetBase;
    }
  }

  readBuildVersion() {
    const buildVersion = String(this.getAttribute('data-floating-build') || '').trim();
    const hasUsableVersion = /^[0-9A-Za-z._-]+$/.test(buildVersion);

    this.version =
      hasUsableVersion && buildVersion >= floatingHomeCurrentBuild
        ? buildVersion
        : floatingHomeCurrentBuild;

    if (this.getAttribute('data-floating-build') !== this.version) {
      this.setAttribute('data-floating-build', this.version);
    }
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
          min-height: 100vh;
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

    if (this.isWixEditorCanvas()) {
      root.innerHTML = this.renderEditorCanvasPreview();
      this.hasRendered = true;
      this.classList.add('is-ready');
      return;
    }

    try {
      const response = await fetch(this.asset('index.html'), { mode: 'cors' });
      if (!response.ok) throw new Error(`Could not load index.html (${response.status})`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const bodyHtml = doc.body ? doc.body.innerHTML : '';
      const editorPreview = this.isWixEditorPreview();

      root.innerHTML = `
        <link rel="stylesheet" href="${this.asset('styles.css')}" data-floating-stylesheet>
        <style>
          :host {
            display: block;
            width: 100%;
            min-height: 100vh;
            background: #f4efe3;
            color: #1f3937;
            font-family: "Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .floating-loader {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 48px;
            color: var(--clr-primary, #0A5651);
            background: var(--clr-bg, #F4EFE3);
            font: 600 16px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
            opacity: ${editorPreview ? '1' : '0'};
            visibility: ${editorPreview ? 'visible' : 'hidden'};
          }

          :host(.is-ready) .floating-loader {
            display: none;
          }

          :host(.is-ready) .floating-root {
            opacity: 1;
            visibility: visible;
            transition: opacity 180ms ease;
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

          .floating-root .scroll-progress {
            display: none !important;
          }

          .floating-root .navbar,
          .floating-root .cookie-banner,
          .floating-root .skip-link {
            position: absolute;
          }

          .floating-root .navbar {
            top: 0;
            background: rgba(244,239,227,0.97);
          }

          ${editorPreview ? `
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
        <div class="floating-loader">Loading Floating Counselling...</div>
        <div class="floating-root">${bodyHtml}</div>
      `;

      const stylesheetReady = this.waitForStylesheet(root.querySelector('[data-floating-stylesheet]'));

      this.rewriteLocalAssets();
      this.prepareImagesForFastPaint();
      this.hasRendered = true;
      this.applyCmsData();
      this.finalizeContent();
      this.bindInteractions();
      this.scheduleWixIsolation();
      await stylesheetReady;
      this.repairWixTopGap();
      this.classList.add('is-ready');
    } catch (error) {
      root.innerHTML = `
        <div class="floating-error">
          <strong>Floating Counselling could not load.</strong><br>
          ${this.escapeHtml(error.message)}
        </div>
      `;
    }
  }

  waitForStylesheet(stylesheet) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      if (!stylesheet) {
        finish();
        return;
      }

      stylesheet.addEventListener('load', finish, { once: true });
      stylesheet.addEventListener('error', finish, { once: true });

      try {
        if (stylesheet.sheet) {
          window.setTimeout(finish, 0);
        }
      } catch (error) {
        // Cross-origin stylesheet inspection may be blocked; the timeout still reveals the page.
      }

      window.setTimeout(finish, 1800);
    });
  }

  prepareWixHost() {
    this.installGlobalGuards();
    this.hideExternalNoise();
    this.setAttribute('data-floating-home-host', 'true');
    this.style.setProperty('display', 'block', 'important');
    this.style.setProperty('position', 'relative', 'important');
    this.style.setProperty('z-index', '1', 'important');
    this.style.setProperty('box-sizing', 'border-box', 'important');
    this.style.setProperty('background', '#f4efe3', 'important');
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

  installGlobalGuards() {
    if (!document.head || document.getElementById('floating-home-global-guards')) return;

    const style = document.createElement('style');
    style.id = 'floating-home-global-guards';
    style.textContent = `
      html,
      body {
        background: #f4efe3 !important;
        overflow-x: hidden !important;
      }

      [id*="poptin" i],
      [class*="poptin" i],
      iframe[src*="poptin" i],
      a[href*="poptin.com" i] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      [data-floating-home-hidden="true"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  preloadCriticalAssets() {
    if (!document.head) return;

    [
      ['preload', 'fetch', this.asset('index.html')],
      ['preload', 'style', this.asset('styles.css')],
      ['preload', 'image', this.asset('images/logo.webp')],
      ['preload', 'image', this.asset('images/counselling-real-20260515.webp')],
      ['prefetch', 'image', this.asset('images/team-celestina.webp')],
      ['prefetch', 'image', this.asset('images/hub-real-20260515.webp')],
    ].forEach(([rel, as, href]) => {
      if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

      const link = document.createElement('link');
      link.rel = rel;
      link.as = as;
      link.href = href;
      if (as === 'fetch') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  isWixEditorPreview() {
    const href = window.location.href || '';
    const referrer = document.referrer || '';

    return /CustomElementPreviewIframe|editor-elements-library|editor\.wix\.com|\/html\/editor\//i.test(`${href} ${referrer}`);
  }

  isWixEditorCanvas() {
    const href = window.location.href || '';
    const referrer = document.referrer || '';

    return (
      /CustomElementPreviewIframe|editor-elements-library/i.test(href) &&
      /editor\.wix\.com\/html\/editor\/web\/renderer\/edit/i.test(referrer)
    );
  }

  renderEditorCanvasPreview() {
    const logo = this.asset('images/logo.webp');
    const hero = this.asset('images/counselling-real-20260515.webp');

    return `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 900px;
          background: #f4efe3;
          color: #123f3b;
          font-family: "Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          contain: content;
          overflow: hidden;
        }

        .editor-home {
          min-height: 900px;
          padding: 30px clamp(28px, 5vw, 64px) 56px;
          background:
            radial-gradient(circle at 83% 17%, rgba(199,221,218,0.85), transparent 34%),
            linear-gradient(115deg, #f4efe3 0%, #f6f1e6 48%, #eef6ef 100%);
          box-sizing: border-box;
        }

        .editor-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 58px;
        }

        .editor-logo {
          display: block;
          width: min(210px, 28vw);
          min-width: 150px;
          height: auto;
        }

        .editor-links {
          display: flex;
          align-items: center;
          gap: clamp(12px, 1.5vw, 22px);
          font-size: 14px;
          font-weight: 700;
          color: #244744;
          white-space: nowrap;
        }

        .editor-links span:last-child {
          padding: 12px 20px;
          border-radius: 999px;
          color: #f9f2e6;
          background: #0a5651;
        }

        .editor-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.88fr);
          align-items: center;
          gap: clamp(36px, 5vw, 78px);
        }

        .editor-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 34px;
          padding: 13px 22px;
          border: 1px solid rgba(10, 86, 81, 0.12);
          border-radius: 999px;
          background: rgba(229, 236, 224, 0.78);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.36);
          color: #245f5a;
          font-weight: 750;
        }

        .editor-badge span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #c46a4a;
        }

        h1 {
          margin: 0 0 26px;
          max-width: 760px;
          font-family: "Bricolage Grotesque", "Inter Tight", system-ui, sans-serif;
          font-size: clamp(54px, 7.2vw, 96px);
          line-height: 1.04;
          letter-spacing: 0;
          color: #0a5651;
        }

        h1 em {
          color: #c46a4a;
          font-style: italic;
          font-weight: 500;
        }

        .editor-copy {
          max-width: 690px;
          margin: 0 0 38px;
          color: #627370;
          font-size: clamp(19px, 2vw, 25px);
          line-height: 1.55;
          font-weight: 500;
        }

        .editor-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
        }

        .editor-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          padding: 0 34px;
          border-radius: 999px;
          border: 2px solid #0a5651;
          color: #0a5651;
          font-size: 18px;
          font-weight: 800;
        }

        .editor-button.primary {
          min-width: 220px;
          color: #f8f1e4;
          background: #0a5651;
        }

        .editor-visual {
          position: relative;
          min-height: 520px;
        }

        .editor-visual img {
          width: 100%;
          height: 100%;
          min-height: 520px;
          object-fit: cover;
          border-radius: 34px;
          box-shadow: 0 34px 90px -42px rgba(8, 43, 39, 0.45);
        }

        .editor-note {
          position: absolute;
          top: 72px;
          left: -52px;
          max-width: 290px;
          padding: 24px 28px;
          border-radius: 22px;
          background: #fffaf1;
          box-shadow: 0 22px 70px -34px rgba(8, 43, 39, 0.42);
        }

        .editor-note strong {
          display: block;
          margin-bottom: 4px;
          color: #0a5651;
          font-size: 20px;
        }

        .editor-note p {
          margin: 0;
          color: #6b7b78;
          font-size: 15px;
        }

        .editor-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 18px;
          margin-top: 54px;
          padding-top: 28px;
          border-top: 1px solid rgba(10, 86, 81, 0.12);
        }

        .editor-stat strong {
          display: block;
          margin-bottom: 4px;
          color: #0a5651;
          font-size: clamp(28px, 3vw, 44px);
          line-height: 1;
          font-weight: 750;
        }

        .editor-stat span {
          color: #687876;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.35;
        }

        @media (max-width: 900px) {
          :host,
          .editor-home {
            min-height: 760px;
          }

          .editor-links {
            display: none;
          }

          .editor-hero {
            grid-template-columns: 1fr;
          }

          .editor-visual {
            display: none;
          }

          .editor-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>
      <div class="editor-home">
        <header class="editor-nav">
          <img class="editor-logo" src="${logo}" alt="Floating Counselling">
          <div class="editor-links" aria-hidden="true">
            <span>Services</span>
            <span>Find help</span>
            <span>Parenting</span>
            <span>Holiday School</span>
            <span>Fundraiser</span>
            <span>Book a Session</span>
          </div>
        </header>

        <main class="editor-hero">
          <section>
            <div class="editor-badge"><span></span> Croydon · Redbridge · Newham · Durham · Southwark</div>
            <h1>Counselling, <em>Community</em> &amp; Compassion.</h1>
            <p class="editor-copy">A UK-based grassroots charity empowering individuals, families and marginalised groups through holistic support, therapeutic care, practical help and community-driven programmes designed as wraparound care.</p>
            <div class="editor-buttons" aria-hidden="true">
              <span class="editor-button primary">Book a Session</span>
              <span class="editor-button">Find the right support</span>
              <span class="editor-button">Fundraiser</span>
            </div>
          </section>

          <section class="editor-visual" aria-label="Floating Counselling community gathering">
            <img src="${hero}" alt="">
            <div class="editor-note">
              <strong>Trauma-informed</strong>
              <p>Care that meets you where you are</p>
            </div>
          </section>
        </main>

        <section class="editor-stats" aria-label="Floating Counselling impact">
          <div class="editor-stat"><strong>15,000+</strong><span>Counselling sessions delivered</span></div>
          <div class="editor-stat"><strong>50,000+</strong><span>Clinical hours of care</span></div>
          <div class="editor-stat"><strong>45 yrs</strong><span>Combined clinical experience</span></div>
          <div class="editor-stat"><strong>1,400+</strong><span>Children supported</span></div>
          <div class="editor-stat"><strong>10+ yrs</strong><span>Croydon, Redbridge, Newham, Durham &amp; Southwark</span></div>
        </section>
      </div>
    `;
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
    const topOffset = naturalTop > 0 ? -naturalTop : 0;

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

  repairWixTopGap() {
    if (!this.isConnected || this.isWixEditorPreview()) return;

    const root = this.shadowRoot;
    const anchor =
      (root && root.querySelector('.navbar')) ||
      (root && root.querySelector('.hero')) ||
      this;
    const anchorRect = anchor.getBoundingClientRect();
    const anchorTop = anchorRect && Number.isFinite(anchorRect.top) ? anchorRect.top : 0;

    if (anchorTop <= 1 || (window.scrollY || window.pageYOffset || 0) > 8) {
      return;
    }

    const currentMarginTop = Number.parseFloat(this.style.marginTop) || 0;
    const nextMarginTop = Math.round(currentMarginTop - anchorTop);

    if (Math.abs(nextMarginTop - currentMarginTop) > 1) {
      this.style.setProperty('margin-top', `${nextMarginTop}px`, 'important');
    }
  }

  scheduleWixIsolation() {
    if (this.isWixEditorPreview()) {
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

  startWixLayoutWatchdog() {
    if (this.isWixEditorPreview() || this.layoutWatchdog) return;

    const repair = this.boundRepairWixLayout;

    window.addEventListener('resize', repair, { passive: true });
    window.addEventListener('orientationchange', repair, { passive: true });
    window.addEventListener('pageshow', repair, { passive: true });
    window.addEventListener('focus', repair, { passive: true });
    document.addEventListener('visibilitychange', repair, { passive: true });

    [0, 120, 500, 1200, 2600, 5200].forEach((delay) => {
      window.setTimeout(repair, delay);
    });

    this.layoutWatchdog = window.setInterval(repair, 1500);
  }

  stopWixLayoutWatchdog() {
    if (!this.layoutWatchdog) return;

    const repair = this.boundRepairWixLayout;

    window.clearInterval(this.layoutWatchdog);
    this.layoutWatchdog = 0;
    window.removeEventListener('resize', repair);
    window.removeEventListener('orientationchange', repair);
    window.removeEventListener('pageshow', repair);
    window.removeEventListener('focus', repair);
    document.removeEventListener('visibilitychange', repair);
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
    this.repairWixTopGap();
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

    this.scrubLegacyImages(node);
    node.setAttribute('data-floating-home-hidden', 'true');
    node.setAttribute('aria-hidden', 'true');
    node.style.setProperty('display', 'none', 'important');
    node.style.setProperty('visibility', 'hidden', 'important');
    node.style.setProperty('pointer-events', 'none', 'important');
    node.style.setProperty('height', '0', 'important');
    node.style.setProperty('min-height', '0', 'important');
    node.style.setProperty('overflow', 'hidden', 'important');
  }

  scrubLegacyImages(node) {
    if (!node || this.isWixEditorPreview()) return;

    node.querySelectorAll('img, source').forEach((media) => {
      if (media.closest('floating-home')) return;

      const source = media.getAttribute('src');
      const sourceSet = media.getAttribute('srcset');

      if (source && !media.getAttribute('data-floating-src')) {
        media.setAttribute('data-floating-src', source);
      }

      if (sourceSet && !media.getAttribute('data-floating-srcset')) {
        media.setAttribute('data-floating-srcset', sourceSet);
      }

      media.removeAttribute('srcset');

      if (media.tagName === 'IMG') {
        media.setAttribute('loading', 'lazy');
        media.setAttribute('decoding', 'async');
        media.setAttribute('fetchpriority', 'low');
        media.setAttribute(
          'src',
          'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        );
      }
    });
  }

  rewriteLocalAssets() {
    this.shadowRoot.querySelectorAll('[src]').forEach((node) => {
      const source = node.getAttribute('src');
      if (source && /^(images|\.\/images)\//.test(source)) {
        node.setAttribute('src', this.asset(source.replace(/^\.\//, '')));
      }
    });
  }

  prepareImagesForFastPaint() {
    const images = Array.from(this.shadowRoot.querySelectorAll('img'));

    images.forEach((image, index) => {
      image.setAttribute('decoding', 'async');

      if (index < 2 || image.closest('.hero, .nav-logo')) {
        image.setAttribute('loading', 'eager');
        image.setAttribute('fetchpriority', 'high');
      }
    });
  }

  hideExternalNoise() {
    if (!document.body) return;

    const selectors = [
      '[id*="poptin" i]',
      '[class*="poptin" i]',
      'iframe[src*="poptin" i]',
      'a[href*="poptin.com" i]',
    ];

    document.querySelectorAll(selectors.join(',')).forEach((node) => {
      if (node === this || this.contains(node)) return;

      node.setAttribute('aria-hidden', 'true');
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('opacity', '0', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
    });
  }

  readCmsAttribute() {
    const rawValue = this.getAttribute('data-cms');

    if (!rawValue) {
      this.cmsData = null;
      return;
    }

    try {
      this.cmsData = this.normalizeCmsPayload(JSON.parse(rawValue));
    } catch (error) {
      this.cmsData = null;
      this.setAttribute('data-cms-error', 'invalid-json');
    }
  }

  normalizeCmsPayload(payload) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const content = {};
    const groupedItems = {};

    if (Array.isArray(source.content)) {
      source.content.forEach((entry) => {
        if (!entry || entry.enabled === false || !entry.key) return;
        content[String(entry.key)] = entry;
      });
    } else if (source.content && typeof source.content === 'object') {
      Object.keys(source.content).forEach((key) => {
        const value = source.content[key];
        content[key] = value && typeof value === 'object' ? { key, ...value } : { key, value };
      });
    }

    const itemSource = source.items;
    if (Array.isArray(itemSource)) {
      itemSource.forEach((item) => {
        if (!item || item.enabled === false || !item.section) return;
        const section = String(item.section);
        if (!groupedItems[section]) groupedItems[section] = [];
        groupedItems[section].push(item);
      });
    } else if (itemSource && typeof itemSource === 'object') {
      Object.keys(itemSource).forEach((section) => {
        groupedItems[section] = Array.isArray(itemSource[section])
          ? itemSource[section].filter((item) => item && item.enabled !== false)
          : [];
      });
    }

    Object.keys(groupedItems).forEach((section) => {
      groupedItems[section].sort((a, b) => {
        const left = Number(a.order ?? a.sortOrder ?? 0);
        const right = Number(b.order ?? b.sortOrder ?? 0);
        return left - right;
      });
    });

    return { content, items: groupedItems };
  }

  applyCmsData() {
    if (!this.cmsData || !this.shadowRoot) return;

    this.applyCmsContentOverrides();
    this.renderCmsLists();
    this.rewriteLocalAssets();
    this.setAttribute('data-cms-ready', 'true');
  }

  applyCmsContentOverrides() {
    const root = this.shadowRoot;

    root.querySelectorAll('[data-cms-text]').forEach((node) => {
      const value = this.cmsText(node.getAttribute('data-cms-text'));
      if (value !== null) node.textContent = value;
    });

    root.querySelectorAll('[data-cms-href]').forEach((node) => {
      const value = this.cmsUrl(node.getAttribute('data-cms-href'));
      if (value) node.setAttribute('href', value);
    });

    root.querySelectorAll('[data-cms-image]').forEach((node) => {
      this.applyCmsImage(node, this.cmsEntry(node.getAttribute('data-cms-image')));
    });
  }

  renderCmsLists() {
    this.renderPathways();
    this.renderServices();
    this.renderCommunityModel();
    this.renderHolidayValues();
    this.renderHolidaySupport();
    this.renderHolidayWeeks();
    this.renderHubEvents();
    this.renderHubFlyers();
    this.renderTestimonials();
    this.renderTeam();
    this.renderPartners();
    this.renderOriginalPages();
    this.renderAssistantPrompts();
  }

  cmsEntry(key) {
    if (!key || !this.cmsData) return null;
    return this.cmsData.content[key] || null;
  }

  cmsText(key) {
    return this.entryText(this.cmsEntry(key));
  }

  cmsUrl(key) {
    const entry = this.cmsEntry(key);
    if (!entry) return '';
    return this.stringValue(entry.url || entry.href || entry.link || entry.value);
  }

  cmsItems(section) {
    if (!section || !this.cmsData) return [];
    return this.cmsData.items[section] || [];
  }

  entryText(entry) {
    if (entry === null || entry === undefined) return null;
    if (typeof entry === 'string' || typeof entry === 'number') return String(entry);

    return this.stringValue(
      entry.value ?? entry.text ?? entry.body ?? entry.description ?? entry.title ?? entry.name ?? null,
    );
  }

  itemText(item, fields) {
    for (const field of fields) {
      const value = item && item[field];
      if (value !== undefined && value !== null && value !== '') return this.stringValue(value);
    }

    return '';
  }

  stringValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      return value.text || value.value || value.url || value.src || '';
    }
    return String(value);
  }

  mediaValue(value) {
    if (!value) return '';

    if (typeof value === 'object') {
      return this.mediaValue(value.src || value.url || value.image || value.fileUrl || value.value);
    }

    const rawValue = String(value).trim();
    if (!rawValue) return '';

    const wixMatch = rawValue.match(/^(?:wix:)?image:\/\/v1\/([^/#?]+)/i);
    if (wixMatch) {
      return `https://static.wixstatic.com/media/${wixMatch[1]}`;
    }

    if (/^(images|\.\/images)\//.test(rawValue)) {
      return this.asset(rawValue.replace(/^\.\//, ''));
    }

    return rawValue;
  }

  teamProfileDefaults(name) {
    const normalizedName = String(name || '').toLowerCase();
    const profiles = [
      {
        match: 'celestina',
        image: this.asset('images/team-celestina.webp'),
        email: 'info@floatingcounselling.co.uk',
        url: 'https://uk.linkedin.com/in/celestina-oniye-thomas',
        ctaLabel: 'Read more',
      },
      {
        match: 'omowonu',
        image: this.asset('images/team-omowonu.webp'),
        email: 'floatingcounsellingcommunity@gmail.com',
        url: 'https://financecareers.nhs.uk/resource/nhs-finance-career-stories-successful-moves-between-nhs-sectors-wonu-ogunlela/',
        ctaLabel: 'Read more',
      },
      {
        match: 'elizabeth',
        image: this.asset('images/team-elizabeth.webp'),
        email: 'info@floatingcounselling.co.uk',
        url: 'https://myfamily101.kit.com/e96f58fc71',
        ctaLabel: 'Read more',
      },
      {
        match: 'linda',
        image: this.asset('images/team-linda.webp'),
        email: 'floatingcounsellinglinda@gmail.com',
        url: 'mailto:floatingcounsellinglinda@gmail.com?subject=Floating%20Counselling%20enquiry',
        ctaLabel: 'Contact',
      },
    ];

    return profiles.find((profile) => normalizedName.includes(profile.match)) || {};
  }

  translatePageUrl() {
    try {
      const url = new URL(window.location.href);
      url.hash = '';
      return url.toString();
    } catch (error) {
      return 'https://www.floatingcounselling.co.uk/';
    }
  }

  translationEndpoint() {
    return String(this.getAttribute('data-translation-endpoint') || '').trim();
  }

  loadTranslationClient() {
    if (window.FloatingPageTranslator) {
      return Promise.resolve(window.FloatingPageTranslator);
    }

    if (this.translationClientPromise) {
      return this.translationClientPromise;
    }

    this.translationClientPromise = new Promise((resolve, reject) => {
      let timeout = 0;
      const finish = (translator) => {
        if (!translator || !translator.create) return;
        window.clearTimeout(timeout);
        window.removeEventListener('floatingtranslationready', handleReady);
        resolve(translator);
      };
      const handleReady = (event) => finish(event.detail);

      window.addEventListener('floatingtranslationready', handleReady);
      timeout = window.setTimeout(() => {
        window.removeEventListener('floatingtranslationready', handleReady);
        reject(new Error('Translation client timed out'));
      }, 4000);

      const existing = document.querySelector('script[data-floating-translation-client]');
      if (existing) {
        existing.addEventListener('load', () => finish(window.FloatingPageTranslator), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = this.asset('floating-translation.js');
      script.defer = true;
      script.dataset.floatingTranslationClient = 'true';
      script.onload = () => finish(window.FloatingPageTranslator);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return this.translationClientPromise;
  }

  bindLanguageTranslation(root, languageSelect, navToggle, navLinks) {
    const closeNav = () => {
      if (!navToggle || !navLinks) return;
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    this.loadTranslationClient()
      .then((translator) => {
        if (!translator || !translator.create) throw new Error('Translation client unavailable');
        translator.create({
          root,
          select: languageSelect,
          endpoint: () => this.translationEndpoint(),
          pageUrl: () => this.translatePageUrl(),
          onAfterChange: closeNav,
        });
      })
      .catch(() => {
        if (languageSelect.dataset.floatingTranslatorFallbackReady === 'true') return;
        languageSelect.dataset.floatingTranslatorFallbackReady = 'true';

        languageSelect.addEventListener('change', () => {
          const language = languageSelect.value;
          if (!language || language === 'en') {
            closeNav();
            return;
          }

          languageSelect.value = 'en';
          closeNav();
        });
      });
  }

  applyCmsImage(node, entryOrItem) {
    if (!node || !entryOrItem) return;

    const image = this.mediaValue(
      entryOrItem.image || entryOrItem.imageUrl || entryOrItem.photo || entryOrItem.logo || entryOrItem.media || entryOrItem.value,
    );
    const alt = this.stringValue(entryOrItem.alt || entryOrItem.altText || entryOrItem.title || entryOrItem.name);
    const img = node.matches && node.matches('img') ? node : node.querySelector && node.querySelector('img');

    if (img && image) {
      img.setAttribute('src', image);
      img.removeAttribute('srcset');
    }

    if (img && alt) {
      img.setAttribute('alt', alt);
    }
  }

  replaceList(selector, section, renderItem) {
    const root = this.shadowRoot;
    const container = root.querySelector(selector);
    let items = this.cmsItems(section);

    if (!container || !items.length) return;
    if (container.dataset.cmsStatic === 'true') return;

    const skipTitles = String(container.dataset.cmsSkipTitles || '')
      .split('|')
      .map((title) => title.trim().toLowerCase())
      .filter(Boolean);
    if (skipTitles.length) {
      items = items.filter((item) => {
        const title = this.itemText(item, ['title', 'name']).trim().toLowerCase();
        return !skipTitles.includes(title);
      });
    }

    const limit = Number.parseInt(container.dataset.cmsLimit || '', 10);
    if (Number.isFinite(limit) && limit > 0) {
      items = items.slice(0, limit);
    }

    if (!items.length) return;

    const templates = Array.from(container.children);
    if (!templates.length) return;

    container.replaceChildren();
    items.forEach((item, index) => {
      const template = templates[index] || templates[templates.length - 1];
      const node = template.cloneNode(true);
      node.style.opacity = '';
      node.style.transform = '';
      renderItem.call(this, node, item, index);
      container.appendChild(node);
    });
  }

  renderServices() {
    this.replaceList('.services-grid', 'services', (node, item) => {
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
      this.setLink(node.querySelector('a'), item);
    });
  }

  renderPathways() {
    this.replaceList('.pathway-grid', 'pathways', (node, item) => {
      this.setNodeText(node.querySelector('.pathway-kicker'), this.itemText(item, ['tag', 'subtitle', 'label']));
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
      this.setLink(node.querySelector('a'), item);
    });
  }

  renderCommunityModel() {
    this.replaceList('.community-model-cards', 'communityModel', (node, item) => {
      this.setNodeText(node.querySelector('span'), this.itemText(item, ['tag', 'subtitle', 'label']));
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
    });
  }

  renderHolidayValues() {
    this.renderPillList('.holiday-values', 'holidayValues');
  }

  renderHolidaySupport() {
    this.renderPillList('.support-list', 'holidaySupport');
  }

  renderPillList(selector, section) {
    const root = this.shadowRoot;
    const container = root.querySelector(selector);
    const items = this.cmsItems(section);

    if (!container || !items.length) return;

    container.replaceChildren();
    items.forEach((item) => {
      const pill = document.createElement('span');
      pill.textContent = this.itemText(item, ['title', 'name', 'value', 'text']);
      container.appendChild(pill);
    });
  }

  renderHolidayWeeks() {
    this.replaceList('.holiday-week-grid', 'holidayWeeks', (node, item) => {
      this.applyCmsImage(node.querySelector('img'), item);
      this.setNodeText(node.querySelector('span'), this.itemText(item, ['tag', 'subtitle', 'label']));
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
    });
  }

  renderHubEvents() {
    this.replaceList('.hub-events', 'hubEvents', (node, item) => {
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
    });
  }

  renderHubFlyers() {
    this.replaceList('.hub-flyer-grid', 'hubFlyers', (node, item) => {
      this.applyCmsImage(node.querySelector('img'), item);
    });
  }

  renderTestimonials() {
    this.replaceList('.testimonials-grid', 'testimonials', (node, item) => {
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'quote', 'description', 'text']));
      this.setNodeText(node.querySelector('.testimonial-author h4'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('.testimonial-author span'), this.itemText(item, ['subtitle', 'role', 'location']));
      this.setNodeText(node.querySelector('.t-avatar'), this.itemText(item, ['initials']) || this.initials(this.itemText(item, ['title', 'name'])));
    });
  }

  renderTeam() {
    this.replaceList('.team-grid', 'team', (node, item) => {
      const personName = this.itemText(item, ['title', 'name']);
      const defaults = this.teamProfileDefaults(personName);
      const image = defaults.image || this.mediaValue(item.image || item.imageUrl || item.photo);
      let photo = node.querySelector('.team-photo');

      if (image) {
        if (!photo) {
          const avatar = node.querySelector('.team-avatar');
          photo = document.createElement('figure');
          photo.className = 'team-photo';
          photo.innerHTML = '<img alt="">';
          if (avatar) avatar.replaceWith(photo);
          else node.prepend(photo);
        }
        this.applyCmsImage(photo, {
          ...item,
          image,
          alt: this.itemText(item, ['alt', 'altText']) || personName,
        });
      } else if (photo) {
        const avatar = document.createElement('div');
        avatar.className = 'team-avatar team-avatar--fallback';
        avatar.textContent = this.itemText(item, ['initials']) || this.initials(this.itemText(item, ['title', 'name']));
        photo.replaceWith(avatar);
      }

      this.setNodeText(node.querySelector('h4'), personName);
      this.setNodeText(node.querySelector('.role'), this.itemText(item, ['role', 'subtitle']));

      const email = defaults.email || this.itemText(item, ['email']);
      const emailNode = node.querySelector('.email');
      if (emailNode && email) {
        emailNode.textContent = 'Email';
        emailNode.setAttribute('href', `mailto:${email}`);
        emailNode.setAttribute('title', email);
        emailNode.hidden = false;
      } else if (emailNode) {
        emailNode.hidden = true;
      }

      this.setLink(node.querySelector('.team-readmore'), {
        ...item,
        url: defaults.url || this.itemText(item, ['url', 'href', 'link']),
        ctaLabel:
          defaults.ctaLabel ||
          this.itemText(item, ['ctaLabel', 'buttonLabel', 'linkLabel']) ||
          'Read more',
      });
    });
  }

  renderPartners() {
    this.replaceList('.partners-logo-grid', 'partners', (node, item) => {
      this.applyCmsImage(node.querySelector('img'), item);
    });
  }

  renderOriginalPages() {
    this.replaceList('#original-pages .resources-grid', 'originalPages', (node, item) => {
      this.setNodeText(node.querySelector('.resource-tag'), this.itemText(item, ['tag', 'subtitle', 'label']));
      this.setNodeText(node.querySelector('h3'), this.itemText(item, ['title', 'name']));
      this.setNodeText(node.querySelector('p'), this.itemText(item, ['body', 'description', 'text']));
      this.setLink(node, item);
      this.setNodeText(node.querySelector('.resource-cta'), this.itemText(item, ['ctaLabel']) || 'Open original page →');
    });
  }

  renderAssistantPrompts() {
    const items = this.cmsItems('assistantPrompts');
    if (!items.length) return;

    ['.assistant-prompts', '.assistant-panel-prompts'].forEach((selector) => {
      const container = this.shadowRoot.querySelector(selector);
      if (!container) return;

      container.replaceChildren();
      items.forEach((item) => {
        const link = document.createElement('a');
        link.textContent = this.itemText(item, ['title', 'name', 'ctaLabel']) || 'Ask for help';
        link.setAttribute('href', this.itemText(item, ['url', 'href', 'link']) || '#contact');
        container.appendChild(link);
      });
    });
  }

  setNodeText(node, value) {
    if (node && value) node.textContent = value;
  }

  setLink(node, item) {
    if (!node || !item) return;
    const href = this.itemText(item, ['url', 'href', 'link']);
    const label = this.itemText(item, ['ctaLabel', 'buttonLabel', 'linkLabel']);

    if (href) {
      node.setAttribute('href', href);
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener');
      } else {
        node.removeAttribute('target');
        node.removeAttribute('rel');
      }
    }

    if (label) {
      const span = node.querySelector && node.querySelector('span');
      if (span && node.classList.contains('learn-more')) span.textContent = '→';
      const labelNode = node.classList.contains('learn-more') ? node.childNodes[0] : null;
      if (labelNode && labelNode.nodeType === Node.TEXT_NODE) labelNode.textContent = `${label} `;
      if (node.classList.contains('team-readmore')) {
        const textNode = Array.from(node.childNodes).find((child) => child.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = `${label} `;
      }
    }
  }

  initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
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

    this.bindSupportFabVisibility(root);

    root.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href.length < 2) return;

        const target = root.querySelector(href);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.updateSupportFabVisibility();
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

    const languageSelect = root.getElementById('languageSelect');
    if (languageSelect) {
      this.bindLanguageTranslation(root, languageSelect, navToggle, navLinks);
    }

    const assistantPanel = root.querySelector('[data-assistant-panel]');
    const assistantWidget = root.querySelector('[data-assistant-widget]');
    const assistantOpenButtons = root.querySelectorAll('[data-assistant-open]');
    const assistantCloseButtons = root.querySelectorAll('[data-assistant-close]');

    const setAssistantOpen = (open) => {
      if (!assistantPanel) return;
      assistantPanel.hidden = !open;
      if (assistantWidget) assistantWidget.classList.toggle('is-open', open);
      assistantOpenButtons.forEach((button) => {
        button.setAttribute('aria-expanded', String(open));
      });
    };

    assistantOpenButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setAssistantOpen(Boolean(assistantPanel && assistantPanel.hidden));
      });
    });

    assistantCloseButtons.forEach((button) => {
      button.addEventListener('click', () => setAssistantOpen(false));
    });

    if (assistantPanel) {
      assistantPanel.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setAssistantOpen(false));
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

  bindSupportFabVisibility(root) {
    this.stopSupportFabWatcher();

    const supportFabs = root.querySelectorAll('.support-fab, .donate-fab, .fundraiser-fab');
    const backToTop = root.getElementById('backToTop');
    const contactEl = root.getElementById('contact');
    const footerEl = root.querySelector('.footer');

    if (!supportFabs.length && !backToTop) {
      return;
    }

    const pageScrollY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      (document.body && document.body.scrollTop) ||
      0;
    const pageScrollMax = () =>
      Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
        document.body ? document.body.scrollHeight - window.innerHeight : 0,
      );
    const scrollPageToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      if (document.body) {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    let lastFabY = pageScrollY();
    let scrollingDown = false;

    this.updateSupportFabVisibility = () => {
      const y = pageScrollY();
      const max = pageScrollMax();

      if (y > lastFabY + 12) scrollingDown = true;
      else if (y < lastFabY - 12) scrollingDown = false;
      lastFabY = y;

      const contactRect = contactEl && contactEl.getBoundingClientRect();
      const footerRect = footerEl && footerEl.getBoundingClientRect();
      const contactIsVisible = contactRect && contactRect.top < window.innerHeight - 40 && contactRect.bottom > 80;
      const footerIsVisible = footerRect && footerRect.top < window.innerHeight - 40;
      const inFabRange = y > 600 && y < max - 200 && !contactIsVisible && !footerIsVisible;
      supportFabs.forEach((fab) => fab.classList.toggle('is-visible', inFabRange));

      if (backToTop) {
        backToTop.classList.toggle('is-visible', y > 1200 && !scrollingDown);
      }
    };

    this.supportFabScrollHandler = () => this.updateSupportFabVisibility();

    window.addEventListener('scroll', this.supportFabScrollHandler, { passive: true });
    window.addEventListener('resize', this.supportFabScrollHandler, { passive: true });
    document.addEventListener('scroll', this.supportFabScrollHandler, { passive: true });
    if (document.body) {
      document.body.addEventListener('scroll', this.supportFabScrollHandler, { passive: true });
    }
    this.updateSupportFabVisibility();

    if (backToTop && backToTop.dataset.floatingBound !== 'true') {
      backToTop.dataset.floatingBound = 'true';
      backToTop.addEventListener('click', scrollPageToTop);
    }
  }

  stopSupportFabWatcher() {
    if (!this.supportFabScrollHandler) {
      return;
    }

    window.removeEventListener('scroll', this.supportFabScrollHandler);
    window.removeEventListener('resize', this.supportFabScrollHandler);
    document.removeEventListener('scroll', this.supportFabScrollHandler);
    if (document.body) {
      document.body.removeEventListener('scroll', this.supportFabScrollHandler);
    }
    this.supportFabScrollHandler = null;
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

function refreshFloatingHomeInstances(Constructor) {
  document.querySelectorAll('floating-home').forEach((element) => {
    element.version = floatingHomeCurrentBuild;
    if (floatingHomeAssetBase) {
      element.assetBase = floatingHomeAssetBase;
      element.setAttribute('data-floating-asset-base', floatingHomeAssetBase);
    }
    element.setAttribute('data-floating-build', floatingHomeCurrentBuild);
    element.hasRendered = false;
    element.classList.remove('is-ready');
    if (typeof element.connectedCallback === 'function') {
      element.connectedCallback();
    } else if (typeof element.render === 'function') {
      element.render();
    }
  });

  return Constructor;
}

const existingFloatingHome = customElements.get('floating-home');

if (existingFloatingHome) {
  Object.getOwnPropertyNames(FloatingHome.prototype).forEach((name) => {
    if (name === 'constructor') return;

    Object.defineProperty(
      existingFloatingHome.prototype,
      name,
      Object.getOwnPropertyDescriptor(FloatingHome.prototype, name),
    );
  });

  refreshFloatingHomeInstances(existingFloatingHome);
} else {
  customElements.define('floating-home', FloatingHome);
}
