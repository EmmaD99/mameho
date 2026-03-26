'use strict';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ── Topbar scroll ── */
const topbar = $('#topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Menu overlay ── */
const menu     = $('#menu');
const openBtn  = $('#openMenu');
const closeBtn = $('#closeMenu');
const appleCtx = $('#fallingApples');
const EMOJIS   = ['🍎','🍏','🍋','🌺','🌿','🍎','🍏','🍋'];

function createApples() {
  if (!appleCtx) return;
  appleCtx.innerHTML = '';
  const n = window.innerWidth < 600 ? 10 : 20;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.classList.add('apple-fall');
    const size = 22 + Math.random() * 30;
    el.style.cssText = `left:${Math.random()*102-1}vw;font-size:${size}px;animation-duration:${3+Math.random()*3}s;animation-delay:${Math.random()*2}s;`;
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

/* ── Lightbox ── */
/* IMPORTANT: déclaré avant le listener keydown */
const lightbox    = $('#lightbox');
const lightboxImg = $('#lightboxImg');
const lightboxCap = $('#lightboxCaption');
let galleryItems  = [];
let currentIndex  = 0;

function openLightbox(index) {
  galleryItems = $$('.gallery-item[data-src]');
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
  lightboxImg.src = item.dataset.src;
  lightboxImg.alt = item.dataset.caption || '';
  if (lightboxCap) lightboxCap.textContent = item.dataset.caption || '';
}

function prevPhoto() { currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length; updateLightbox(); }
function nextPhoto() { currentIndex = (currentIndex + 1) % galleryItems.length; updateLightbox(); }

$$('.gallery-item[data-src]').forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
});

$('#lightboxClose')?.addEventListener('click', closeLightbox);
$('#lightboxPrev')?.addEventListener('click', prevPhoto);
$('#lightboxNext')?.addEventListener('click', nextPhoto);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

let touchStartX = 0;
lightbox?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto();
});

/* ── Escape global (après lightbox) ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (menu.classList.contains('active')) closeMenu();
  if (lightbox.classList.contains('active')) closeLightbox();
  const rv = document.getElementById('revendeurModal');
  if (rv?.classList.contains('active')) closeRevendeur();
});

/* ── Validation champ ── */
function validateField(input) {
  const field = input.closest('.field');
  const err   = field?.querySelector('.field-error');
  if (!err) return true;
  err.textContent = '';
  if (input.required && !input.value.trim()) { err.textContent = 'Ce champ est requis.'; return false; }
  if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { err.textContent = 'Adresse email invalide.'; return false; }
  return true;
}

/* ── Formulaire contact ── */
const cf  = $('#contactForm');
const fOk = $('#formSuccess');
if (cf) {
  $$('input, textarea', cf).forEach(inp => inp.addEventListener('blur', () => validateField(inp)));
  cf.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input[required], textarea[required]', cf).forEach(inp => { if (!validateField(inp)) valid = false; });
    if (!valid) return;
    const btn = cf.querySelector('.btn-submit');
    btn.textContent = 'Envoi en cours…'; btn.disabled = true;
    setTimeout(() => {
      if (fOk) fOk.textContent = '✓ Message bien reçu ! Nous vous répondrons rapidement. 🍎';
      cf.reset();
      btn.innerHTML = '<span>Envoyer le message</span><span aria-hidden="true">→</span>';
      btn.disabled = false;
    }, 1200);
  });
}

/* ── Modal Revendeur ── */
const rvModal = document.getElementById('revendeurModal');
const rvForm  = document.getElementById('revendeurForm');
const rvOk    = document.getElementById('rvSuccess');

function openRevendeur() {
  if (!rvModal) return;
  rvModal.classList.add('active');
  rvModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('closeRevendeur')?.focus();
}

function closeRevendeur() {
  if (!rvModal) return;
  rvModal.classList.remove('active');
  rvModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('openRevendeur')?.focus();
}

document.getElementById('openRevendeur')?.addEventListener('click', openRevendeur);
document.getElementById('closeRevendeur')?.addEventListener('click', closeRevendeur);
rvModal?.addEventListener('click', e => { if (e.target === rvModal) closeRevendeur(); });

if (rvForm) {
  $$('input, textarea', rvForm).forEach(inp => inp.addEventListener('blur', () => validateField(inp)));
  rvForm.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input[required]', rvForm).forEach(inp => { if (!validateField(inp)) valid = false; });
    if (!valid) return;
    const btn = rvForm.querySelector('.btn-submit');
    btn.textContent = 'Envoi en cours…'; btn.disabled = true;
    setTimeout(() => {
      if (rvOk) rvOk.textContent = '✓ Demande reçue ! Nous vous contacterons rapidement. 🍎';
      rvForm.reset();
      btn.innerHTML = '<span>Envoyer ma demande</span><span aria-hidden="true">→</span>';
      btn.disabled = false;
    }, 1200);
  });
}

/* ── Année footer ── */
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();