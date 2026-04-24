/* SCHWELLENSCHMOPS — main.js */

(function () {
  'use strict';

  const header     = document.getElementById('site-header');
  const hamburger  = document.getElementById('hamburger');
  const nav        = document.getElementById('main-nav');
  const navLinks   = nav.querySelectorAll('a');

  /* ── Sticky header ───────────────────────────────────────── */
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ─────────────────────────────────────────── */
  function openMenu() {
    nav.classList.add('is-open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    nav.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── Scroll reveal ───────────────────────────────────────── */
  const revealSections = document.querySelectorAll('.reveal-section');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  revealSections.forEach(section => observer.observe(section));

  /* ── Active nav link on scroll ───────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.main-nav ul a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach(a => {
            a.style.opacity = a.getAttribute('href') === '#' + id ? '1' : '0.75';
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => sectionObserver.observe(s));

  /* ── Blog Accordion ─────────────────────────────────────── */
  document.querySelectorAll('.blog-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.blog-card');
      const isOpen = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);
      btn.querySelector('.blog-toggle-icon').textContent = isOpen ? '×' : '+';
    });
  });

  /* ── About Karussell ────────────────────────────────────── */
  const carousel = document.getElementById('about-carousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots   = carousel.querySelectorAll('.dot');
    let current  = 0;
    let timer;

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function startAuto() {
      timer = setInterval(() => goTo(current + 1), 4000);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        goTo(Number(dot.dataset.index));
        startAuto();
      });
    });

    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
  }

  /* ── Contact form: E-Mail-Validierung & Honeypot ──────────── */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const emailRe    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateEmail() {
      const val = emailInput.value.trim();
      if (val && !emailRe.test(val)) {
        emailInput.classList.add('is-invalid');
        emailError.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
        return false;
      }
      emailInput.classList.remove('is-invalid');
      emailError.textContent = '';
      return true;
    }

    emailInput.addEventListener('blur', validateEmail);
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('is-invalid')) validateEmail();
    });

    contactForm.addEventListener('submit', (e) => {
      const hp = contactForm.querySelector('.hp-field');
      if (hp && hp.value) { e.preventDefault(); return; }
      if (!validateEmail()) e.preventDefault();
    });
  }

  /* ── Smooth anchor scroll ────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
