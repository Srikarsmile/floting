/* Floating Counselling — lightweight interactions */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersSmooth = !reduceMotion;
  let anchorScrollId = 0;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  function materializeAnchorPath(target) {
    if (!target || !document.querySelectorAll || typeof Node === 'undefined') return;

    document.querySelectorAll('.section').forEach((section) => {
      const position = section.compareDocumentPosition(target);
      const isBeforeTarget = Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING);

      if (section === target || section.contains(target) || isBeforeTarget) {
        section.style.contentVisibility = 'visible';
      }
    });
  }

  function targetFromHash(hash) {
    if (!hash || hash.length < 2) return null;

    try {
      return document.querySelector(hash);
    } catch (error) {
      return null;
    }
  }

  function scrollToTarget(target) {
    const scrollId = ++anchorScrollId;

    materializeAnchorPath(target);

    const navbar = document.getElementById('navbar');
    const offset = navbar ? navbar.getBoundingClientRect().height + 14 : 0;
    const currentY = () => window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const targetTop = () => Math.max(0, target.getBoundingClientRect().top + currentY() - offset);
    const behavior = prefersSmooth ? 'smooth' : 'auto';

    window.scrollTo({ top: targetTop(), behavior });

    if (!prefersSmooth) return;

    [500, 1100].forEach((delay) => {
      window.setTimeout(() => {
        if (scrollId !== anchorScrollId) return;

        const nextTop = targetTop();
        if (Math.abs(nextTop - currentY()) > 6) {
          window.scrollTo({ top: nextTop, behavior: 'auto' });
        }
      }, delay);
    });
  }

  function formatCounter(value, suffix) {
    return Math.round(value).toLocaleString() + suffix;
  }

  ready(() => {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const progress = document.querySelector('.scroll-progress span');
    const languageSelect = document.getElementById('languageSelect');
    const viewportJobs = [];
    let viewportTicking = false;

    const scheduleViewportUpdate = () => {
      if (viewportTicking) return;
      viewportTicking = true;
      requestAnimationFrame(() => {
        viewportTicking = false;
        viewportJobs.forEach((job) => job());
      });
    };

    const addViewportJob = (job) => {
      viewportJobs.push(job);
    };

    if (navbar) {
      const updateNav = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 24);
      };
      addViewportJob(updateNav);
      updateNav();
    }

    if (navToggle && navLinks) {
      const closeNav = () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
      };

      navToggle.addEventListener('click', () => {
        const open = navToggle.classList.toggle('open');
        navLinks.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeNav);
      });

      if (languageSelect) {
        let translatorBound = false;
        const bindTranslator = (translator) => {
          if (translatorBound || !translator || !translator.create) return;
          translatorBound = true;
          translator.create({
            root: document,
            select: languageSelect,
            onAfterChange: closeNav,
          });
        };

        if (window.FloatingPageTranslator) {
          bindTranslator(window.FloatingPageTranslator);
        } else {
          window.addEventListener('floatingtranslationready', (event) => bindTranslator(event.detail), { once: true });
        }
      }
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href.length < 2) return;
        const target = targetFromHash(href);
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
        if (history.pushState) history.pushState(null, '', href);
      });
    });

    const scrollToCurrentHash = () => {
      const target = targetFromHash(location.hash);
      if (target) scrollToTarget(target);
    };

    if (location.hash) {
      window.setTimeout(scrollToCurrentHash, 120);
    }

    window.addEventListener('hashchange', scrollToCurrentHash);

    if (progress) {
      const updateProgress = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? window.scrollY / max : 0;
        progress.style.transform = `scaleX(${Math.min(1, Math.max(0, pct)).toFixed(4)})`;
      };
      addViewportJob(updateProgress);
      updateProgress();
    }

    document.querySelectorAll('[data-fade], [data-card], [data-stagger] > *')
      .forEach((item) => item.classList.add('is-visible'));

    const counters = document.querySelectorAll('.counter');
    const snapCounters = () => {
      counters.forEach((counter) => {
        counter.textContent = formatCounter(Number(counter.dataset.target || 0), counter.dataset.suffix || '');
      });
    };

    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.target.dataset.counted === 'true') return;
          entry.target.dataset.counted = 'true';

          const target = Number(entry.target.dataset.target || 0);
          const suffix = entry.target.dataset.suffix || '';
          const duration = 900;
          const start = performance.now();

          const tick = (now) => {
            const progressValue = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progressValue, 3);
            entry.target.textContent = formatCounter(target * eased, suffix);
            if (progressValue < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.2 });

      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      snapCounters();
    }

    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const supportFabs = document.querySelectorAll('.support-fab, .donate-fab, .fundraiser-fab');
    const backToTop = document.getElementById('backToTop');
    const assistantWidget = document.querySelector('[data-assistant-widget]');
    const contactEl = document.getElementById('contact');
    const footerEl = document.querySelector('.footer');
    const smallScreen = window.matchMedia('(max-width: 720px)');
    let lastFabY = window.scrollY;
    let scrollingDown = false;

    const updateFabs = () => {
      const y = window.scrollY;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (y > lastFabY + 12) scrollingDown = true;
      else if (y < lastFabY - 12) scrollingDown = false;
      lastFabY = y;

      const withinScrollRange = y > 600 && y < max - 200;
      const contactRect = withinScrollRange && contactEl && contactEl.getBoundingClientRect();
      const footerRect = withinScrollRange && footerEl && footerEl.getBoundingClientRect();
      const contactIsVisible = contactRect && contactRect.top < window.innerHeight - 40 && contactRect.bottom > 80;
      const footerIsVisible = footerRect && footerRect.top < window.innerHeight - 40;
      const inFabRange = withinScrollRange && !contactIsVisible && !footerIsVisible;
      const supportVisible = inFabRange &&
        !document.body.classList.contains('cookie-open') &&
        !document.body.classList.contains('nav-open');
      supportFabs.forEach((fab) => {
        const mobileAllowed = !smallScreen.matches || fab.classList.contains('donate-fab');
        fab.classList.toggle('is-visible', supportVisible && mobileAllowed);
      });
      if (assistantWidget) {
        assistantWidget.classList.toggle(
          'is-muted',
          Boolean(contactIsVisible) || Boolean(footerIsVisible) || (smallScreen.matches && y < 720),
        );
      }
      if (backToTop) backToTop.classList.toggle('is-visible', y > 1200 && !scrollingDown);
    };

    if (supportFabs.length || backToTop) {
      addViewportJob(updateFabs);
      updateFabs();
    }

    if (viewportJobs.length) {
      window.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
      window.addEventListener('resize', scheduleViewportUpdate, { passive: true });
    }

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersSmooth ? 'smooth' : 'auto' });
      });
    }

    const assistantPanel = document.querySelector('[data-assistant-panel]');
    const assistantOpenButtons = document.querySelectorAll('[data-assistant-open]');
    const assistantCloseButtons = document.querySelectorAll('[data-assistant-close]');
    let assistantLastFocus = null;

    const setAssistantOpen = (open) => {
      if (!assistantPanel) return;
      assistantPanel.hidden = !open;
      if (assistantWidget) assistantWidget.classList.toggle('is-open', open);
      assistantOpenButtons.forEach((button) => button.setAttribute('aria-expanded', String(open)));
      if (open) {
        assistantLastFocus = document.activeElement;
        const first = assistantPanel.querySelector('a, button, [tabindex]');
        if (first) first.focus();
      } else if (assistantLastFocus && typeof assistantLastFocus.focus === 'function') {
        assistantLastFocus.focus();
        assistantLastFocus = null;
      }
    };

    assistantOpenButtons.forEach((button) => {
      button.addEventListener('click', () => setAssistantOpen(Boolean(assistantPanel && assistantPanel.hidden)));
    });
    assistantCloseButtons.forEach((button) => button.addEventListener('click', () => setAssistantOpen(false)));
    if (assistantPanel) assistantPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setAssistantOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setAssistantOpen(false);
    });

    const revealDetailsTarget = (hash) => {
      const id = (hash || '').replace('#', '');
      if (!id) return;
      const el = document.getElementById(id);
      if (el && el.tagName === 'DETAILS') el.open = true;
    };

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', () => revealDetailsTarget(anchor.getAttribute('href')));
    });
    window.addEventListener('hashchange', () => revealDetailsTarget(location.hash));
    revealDetailsTarget(location.hash);

    const banner = document.getElementById('cookieBanner');
    if (banner) {
      const consent = localStorage.getItem('fc-cookie-consent');
      if (!consent) {
        banner.hidden = false;
        requestAnimationFrame(() => {
          banner.classList.add('is-visible');
          document.body.classList.add('cookie-open');
        });
      }
      banner.querySelectorAll('[data-cookie]').forEach((button) => {
        button.addEventListener('click', () => {
          localStorage.setItem('fc-cookie-consent', button.dataset.cookie);
          banner.classList.remove('is-visible');
          document.body.classList.remove('cookie-open');
          scheduleViewportUpdate();
          window.setTimeout(() => { banner.hidden = true; }, 300);
        });
      });
    }

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]');
        const status = newsletterForm.querySelector('[data-status]');
        if (!email || !status) return;
        if (!email.value || !email.checkValidity()) {
          status.textContent = 'Please enter a valid email address.';
          status.dataset.state = 'error';
          email.focus();
          return;
        }
        status.textContent = "Thanks, check your inbox to confirm. We'll never spam.";
        status.dataset.state = 'ok';
        email.value = '';
      });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = contactForm.querySelector('[data-status]');
        const required = contactForm.querySelectorAll('[required]');
        const valid = Array.from(required).every((field) => (
          field.type === 'checkbox' ? field.checked : Boolean(field.value && field.value.trim())
        ));
        if (!status) return;
        if (!valid) {
          status.textContent = 'Please complete all required fields.';
          status.dataset.state = 'error';
          return;
        }
        status.textContent = "Thanks, your message has been sent. We'll be in touch within two working days.";
        status.dataset.state = 'ok';
        contactForm.reset();
      });
    }

    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });
})();
