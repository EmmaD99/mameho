'use strict';

// ===============================
// UTILITAIRES
// ===============================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ===============================
// TOPBAR – SCROLL EFFECT
// ===============================
const topbar = $('#topbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  topbar.classList.toggle('scrolled', currentScroll > 30);
  lastScroll = currentScroll;
}, { passive: true });

// ===============================
// MENU OVERLAY + POMMES TOMBANTES
// ===============================
const menu = $('#menu');
const openBtn = $('#openMenu');
const closeBtn = $('#closeMenu');
const appleContainer = $('#fallingApples');

function createFallingApples() {
  if (!appleContainer) return;
  appleContainer.innerHTML = '';
  const count = window.innerWidth < 600 ? 14 : 28;

  for (let i = 0; i < count; i++) {
    const apple = document.createElement('div');
    apple.classList.add('apple');

    const size = Math.random() * 35 + 28; // 28–63px
    apple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 105 - 2}vw;
      animation-duration: ${3.5 + Math.random() * 3.5}s;
      animation-delay: ${Math.random() * 2.2}s;
    `;
    appleContainer.appendChild(apple);
  }
}

function openMenu() {
  menu.classList.add('active');
  menu.setAttribute('aria-hidden', 'false');
  openBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  createFallingApples();
  closeBtn.focus();
}

function closeMenu() {
  menu.classList.remove('active');
  menu.setAttribute('aria-hidden', 'true');
  openBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  openBtn.focus();
}

openBtn.addEventListener('click', openMenu);
closeBtn.addEventListener('click', closeMenu);

$$('.menu-links a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Fermer avec Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu();
});

// ===============================
// REVEAL AU SCROLL (INTERSECTION OBSERVER)
// ===============================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

// ===============================
// CARROUSEL PHOTOS
// ===============================
const track = $('#carouselTrack');
const slides = track ? $$('.carousel-slide', track) : [];
const nextBtn = $('.carousel-btn.next');
const prevBtn = $('.carousel-btn.prev');
const dotsContainer = $('#carouselDots');
let currentIndex = 0;
let autoplayTimer = null;

function buildDots() {
  if (!dotsContainer || slides.length === 0) return;
  dotsContainer.innerHTML = '';
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.classList.add('carousel-dot');
    btn.setAttribute('aria-label', `Photo ${i + 1}`);
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(btn);
  });
}

function updateDots() {
  $$('.carousel-dot', dotsContainer).forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function goTo(index) {
  currentIndex = (index + slides.length) % slides.length;
  if (track) track.style.transform = `translateX(-${currentIndex * 100}%)`;
  updateDots();
  resetAutoplay();
}

function startAutoplay() {
  autoplayTimer = setInterval(() => goTo(currentIndex + 1), 5000);
}

function resetAutoplay() {
  clearInterval(autoplayTimer);
  startAutoplay();
}

if (track && slides.length > 0) {
  buildDots();
  nextBtn?.addEventListener('click', () => goTo(currentIndex + 1));
  prevBtn?.addEventListener('click', () => goTo(currentIndex - 1));

  // Swipe tactile
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(currentIndex + (diff > 0 ? 1 : -1));
  });

  // Pause autoplay au survol
  const container = $('.carousel-container');
  container?.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  container?.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

// ===============================
// FORMULAIRE CONTACT
// ===============================
const contactForm = $('#contactForm');
const formSuccess = $('#formSuccess');

function validateField(input) {
  const field = input.closest('.field');
  const error = field?.querySelector('.field-error');
  if (!error) return true;
  error.textContent = '';

  if (input.required && !input.value.trim()) {
    error.textContent = 'Ce champ est requis.';
    return false;
  }
  if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    error.textContent = 'Adresse email invalide.';
    return false;
  }
  return true;
}

if (contactForm) {
  // Validation en temps réel
  $$('input, textarea', contactForm).forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input[required], textarea[required]', contactForm).forEach(input => {
      if (!validateField(input)) valid = false;
    });
    if (!valid) return;

    // Simulation envoi (pas de backend)
    const btn = contactForm.querySelector('.btn-submit');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      if (formSuccess) {
        formSuccess.textContent = '✓ Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.';
      }
      contactForm.reset();
      btn.textContent = 'Envoyer le message';
      btn.disabled = false;
    }, 1200);
  });
}

// ===============================
// FOOTER – ANNÉE DYNAMIQUE
// ===============================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===============================
// HERO BG PARALLAX LÉGER
// ===============================
const heroBg = $('.hero-bg');
if (heroBg && window.innerWidth > 768) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrollY * 0.25}px) scale(1.05)`;
    }
  }, { passive: true });
}