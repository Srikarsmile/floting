/* ═══════════════════════════════════════════
   Floating Counselling — fluid interactions
   Lenis smooth scroll + GSAP ScrollTrigger
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  // Wait for Lenis + GSAP to be ready (loaded with defer)
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';
    const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

    if (hasST) gsap.registerPlugin(ScrollTrigger);

    /* ── 1. Smooth scroll (snappy lerp mode) ────────── */
    let lenis = null;
    if (hasLenis && !reduceMotion) {
      lenis = new Lenis({
        lerp: 0.15,             // higher = more responsive (less smoothing trail)
        smoothWheel: true,
        wheelMultiplier: 1.1,
        touchMultiplier: 1.5,
      });
      window.lenis = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      if (hasST) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.lagSmoothing(0);
      }
    }

    /* ── 2. Anchor links ────────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.2 });
        else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* ── 3. Navbar — scrolled + show/hide ──────────── */
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    function onScroll() {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 40);
      if (y > 200 && y > lastScroll + 6) navbar.classList.add('is-hidden');
      else if (y < lastScroll - 6 || y < 200) navbar.classList.remove('is-hidden');
      lastScroll = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── 4. Mobile nav ──────────────────────────────── */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );

    /* ── 5. Scroll progress bar ─────────────────────── */
    const progress = document.querySelector('.scroll-progress span');
    if (progress) {
      window.addEventListener(
        'scroll',
        () => {
          const h = document.documentElement;
          const max = h.scrollHeight - h.clientHeight;
          const pct = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
          progress.style.width = (pct * 100).toFixed(2) + '%';
        },
        { passive: true }
      );
    }

    if (!hasGSAP) return; // Reveal/parallax features all require GSAP
    if (reduceMotion) {
      // Reveal everything immediately
      document.querySelectorAll('[data-fade], [data-card]').forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
      document.querySelectorAll('[data-stagger] > *').forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
      return;
    }

    /* ── 6. Tiny word splitter — preserves <em> and other inline tags ──
       NOTE: no overflow:hidden — that was clipping descenders (g, p, y, j) */
    function splitText(el) {
      const targets = [];
      function wrapTextNode(textNode) {
        const text = textNode.textContent;
        if (!text.trim()) return;
        const parts = text.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const wrap = document.createElement('span');
          wrap.className = 'split-word';
          wrap.style.cssText = 'display:inline-block;will-change:transform;line-height:inherit';
          wrap.textContent = part;
          frag.appendChild(wrap);
          targets.push(wrap);
        });
        textNode.parentNode.replaceChild(frag, textNode);
      }
      function walk(node) {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) wrapTextNode(child);
          else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
        });
      }
      walk(el);
      return targets;
    }

    /* ── 7. Reveal animations ───────────────────────── */
    // data-split: split into words and stagger up
    document.querySelectorAll('[data-split]').forEach((el) => {
      const targets = splitText(el);
      if (!targets.length) return;
      gsap.fromTo(
        targets,
        { y: 22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.025,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          clearProps: 'transform',
        }
      );
    });

    // data-fade: simple fade up
    document.querySelectorAll('[data-fade]').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }
      );
    });

    // data-stagger: stagger children up
    document.querySelectorAll('[data-stagger]').forEach((parent) => {
      gsap.fromTo(
        parent.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: parent, start: 'top 88%', once: true },
        }
      );
    });

    // data-card: individual card entrance
    document.querySelectorAll('[data-card]').forEach((el) => {
      if (el.parentElement && el.parentElement.hasAttribute('data-stagger')) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }
      );
    });

    /* ── 8. Parallax — data-parallax + data-speed ───── */
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed || '0.3');
      const trigger = el.closest('section') || el.parentElement;
      gsap.to(el, {
        yPercent: -18 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });

    /* ── 9. Hero 3D tilt ────────────────────────────── */
    if (!isTouch) {
      const tilts = document.querySelectorAll('[data-tilt]');
      tilts.forEach((tilt) => {
        const xTo = gsap.quickTo(tilt, 'rotateY', { duration: 0.8, ease: 'power3.out' });
        const yTo = gsap.quickTo(tilt, 'rotateX', { duration: 0.8, ease: 'power3.out' });
        const parent = tilt.parentElement;
        parent.addEventListener('mousemove', (e) => {
          const r = parent.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          xTo(px * 8);
          yTo(-py * 8);
        });
        parent.addEventListener('mouseleave', () => {
          xTo(0);
          yTo(0);
        });
      });
    }

    /* ── 10. Hero orbs follow pointer (subtle) ──────── */
    if (!isTouch) {
      const hero = document.querySelector('.hero');
      if (hero) {
        const orbs = hero.querySelectorAll('.hero-orb');
        const movers = Array.from(orbs).map((orb, i) => ({
          el: orb,
          x: gsap.quickTo(orb, 'x', { duration: 1.2, ease: 'power3.out' }),
          y: gsap.quickTo(orb, 'y', { duration: 1.2, ease: 'power3.out' }),
          factor: (i + 1) * 12,
        }));
        hero.addEventListener('mousemove', (e) => {
          const r = hero.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          movers.forEach((m) => {
            m.x(px * m.factor);
            m.y(py * m.factor);
          });
        });
      }
    }

    /* ── 11. Sticky impact strip — pinned counters ──── */
    const impactSection = document.getElementById('impact');
    const counters = document.querySelectorAll('.counter');
    const isNarrow = window.matchMedia('(max-width: 720px)').matches;
    if (impactSection && counters.length && !isNarrow) {
      // Pin the full-width track so the centered container stays centered
      ScrollTrigger.create({
        trigger: impactSection,
        start: 'top top',
        end: '+=80%',
        pin: '.impact-track',
        pinSpacing: true,
      });

      // Counter tween driven by scroll
      counters.forEach((c) => {
        const target = parseInt(c.dataset.target || '0', 10);
        const suffix = c.dataset.suffix || '';
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: impactSection,
            start: 'top center',
            end: 'bottom center',
            scrub: 0.6,
          },
          onUpdate: () => {
            c.textContent = Math.round(obj.val).toLocaleString() + suffix;
          },
        });
      });
    }

    /* ── 12. Magnetic buttons ───────────────────────── */
    if (!isTouch) {
      document.querySelectorAll('[data-magnetic]').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left - r.width / 2) * 0.35;
          const py = (e.clientY - r.top - r.height / 2) * 0.35;
          xTo(px);
          yTo(py);
        });
        el.addEventListener('mouseleave', () => {
          xTo(0);
          yTo(0);
        });
      });
    }

    /* ── 13. Custom cursor ──────────────────────────── */
    if (!isTouch) {
      const dot = document.querySelector('.cursor-dot');
      const ring = document.querySelector('.cursor-ring');
      if (dot && ring) {
        const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3.out' });
        const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3.out' });
        const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
        const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

        let visible = false;
        window.addEventListener('mousemove', (e) => {
          if (!visible) {
            dot.style.opacity = 1;
            ring.style.opacity = 1;
            visible = true;
          }
          dotX(e.clientX);
          dotY(e.clientY);
          ringX(e.clientX);
          ringY(e.clientY);
        });

        document
          .querySelectorAll('a, button, [data-card], .service-card, .team-card, .blog-card, .testimonial-card, .event-card, .hub-feature, .theme-week')
          .forEach((el) => {
            el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
          });

        document.addEventListener('mouseleave', () => {
          dot.style.opacity = 0;
          ring.style.opacity = 0;
          visible = false;
        });
      }
    }

    /* ── 14. Refresh on resize ──────────────────────── */
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => ScrollTrigger.refresh(), 200);
    });

    /* ── 15. Refresh after fonts/images load ────────── */
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  });

  /* ═══════════ Lightweight UX glue (works without GSAP) ═══════════ */
  ready(() => {
    /* Footer year */
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Sticky donate FAB + back-to-top */
    const donateFab = document.querySelector('.donate-fab');
    const backToTop = document.getElementById('backToTop');
    function onScrollFabs() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const showFab = y > 600 && y < max - 200;
      if (donateFab) donateFab.classList.toggle('is-visible', showFab);
      if (backToTop) backToTop.classList.toggle('is-visible', y > 1200);
    }
    window.addEventListener('scroll', onScrollFabs, { passive: true });
    onScrollFabs();

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    /* Cookie banner */
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
      banner.querySelectorAll('[data-cookie]').forEach((btn) => {
        btn.addEventListener('click', () => {
          localStorage.setItem('fc-cookie-consent', btn.dataset.cookie);
          banner.classList.remove('is-visible');
          document.body.classList.remove('cookie-open');
          setTimeout(() => { banner.hidden = true; }, 500);
        });
      });
    }

    /* Newsletter form — graceful fallback (no backend) */
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]');
        const status = newsletterForm.querySelector('[data-status]');
        if (!email.value || !email.checkValidity()) {
          status.textContent = 'Please enter a valid email address.';
          status.dataset.state = 'error';
          email.focus();
          return;
        }
        status.textContent = 'Thanks — check your inbox to confirm. We\'ll never spam.';
        status.dataset.state = 'ok';
        email.value = '';
      });
    }

    /* Contact form — graceful fallback */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = contactForm.querySelector('[data-status]');
        const required = contactForm.querySelectorAll('[required]');
        let valid = true;
        required.forEach((field) => {
          if (field.type === 'checkbox' ? !field.checked : !field.value.trim()) valid = false;
        });
        if (!valid) {
          status.textContent = 'Please complete all required fields.';
          status.dataset.state = 'error';
          return;
        }
        status.textContent = 'Thanks — your message has been sent. We\'ll be in touch within two working days.';
        status.dataset.state = 'ok';
        contactForm.reset();
      });
    }

    /* FAQ — close other items when one opens (accordion behaviour) */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          faqItems.forEach((other) => {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  });
})();
