'use strict';

/* ── Utilitaires ─────────────────────── */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ── Topbar scroll ───────────────────── */
const topbar = $('#topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Menu overlay + pommes tombantes ─── */
const menu     = $('#menu');
const openBtn  = $('#openMenu');
const closeBtn = $('#closeMenu');
const appleCtx = $('#fallingApples');
const EMOJIS   = ['🍎', '🍏', '🍋', '🌺', '🌿', '🍎', '🍏', '🍋'];

function createApples() {
  if (!appleCtx) return;
  appleCtx.innerHTML = '';
  const n = window.innerWidth < 600 ? 10 : 20;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.classList.add('apple-fall');
    const size = 22 + Math.random() * 30;
    el.style.cssText = `
      left: ${Math.random() * 102 - 1}vw;
      font-size: ${size}px;
      animation-duration: ${3 + Math.random() * 3}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    appleCtx.appendChild(el);
  }
}

function openMenu() {
  menu.classList.add('active');
  menu.setAttribute('aria-hidden', 'false');
  openBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  createApples();
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
$$('.menu-links a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (menu.classList.contains('active')) closeMenu();
    if (lightbox.classList.contains('active')) closeLightbox();
  }
});

/* ── Reveal au scroll ────────────────── */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revObs.observe(el));

/* ── Lightbox galerie ────────────────── */
const lightbox    = $('#lightbox');
const lightboxImg = $('#lightboxImg');
const lightboxCap = $('#lightboxCaption');
let galleryItems  = [];
let currentIndex  = 0;

function openLightbox(index) {
  const items = $$('.gallery-item[data-src]');
  galleryItems = items;
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('#lightboxClose').focus();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateLightbox() {
  const item = galleryItems[currentIndex];
  if (!item) return;
  const src = item.dataset.src;
  const cap = item.dataset.caption || '';
  lightboxImg.src = src;
  lightboxImg.alt = cap;
  if (lightboxCap) lightboxCap.textContent = cap;
}

function prevPhoto() {
  currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  updateLightbox();
}

function nextPhoto() {
  currentIndex = (currentIndex + 1) % galleryItems.length;
  updateLightbox();
}

$$('.gallery-item[data-src]').forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
});

$('#lightboxClose')?.addEventListener('click', closeLightbox);
$('#lightboxPrev')?.addEventListener('click', prevPhoto);
$('#lightboxNext')?.addEventListener('click', nextPhoto);

lightbox?.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Swipe sur mobile
let touchStartX = 0;
lightbox?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto();
});

/* ── Formulaire de contact ───────────── */
const cf  = $('#contactForm');
const fOk = $('#formSuccess');

function validateField(input) {
  const field = input.closest('.field');
  const err   = field?.querySelector('.field-error');
  if (!err) return true;
  err.textContent = '';
  if (input.required && !input.value.trim()) {
    err.textContent = 'Ce champ est requis.';
    return false;
  }
  if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    err.textContent = 'Adresse email invalide.';
    return false;
  }
  return true;
}

if (cf) {
  $$('input, textarea', cf).forEach(inp => inp.addEventListener('blur', () => validateField(inp)));
  cf.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input[required], textarea[required]', cf).forEach(inp => { if (!validateField(inp)) valid = false; });
    if (!valid) return;
    const btn = cf.querySelector('.btn-submit');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;
    setTimeout(() => {
      if (fOk) fOk.textContent = '✓ Message bien reçu ! Nous vous répondrons rapidement. 🍎';
      cf.reset();
      btn.innerHTML = '<span>Envoyer le message</span><span aria-hidden="true">→</span>';
      btn.disabled = false;
    }, 1200);
  });
}

/* ── Année footer ────────────────────── */
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();