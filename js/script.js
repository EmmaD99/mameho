'use strict';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ── Topbar scroll ── */
const topbar = $('#topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Parallax bouteilles hero — désactivé, reset au scroll ── */
const bottles = $$('.hbottle[data-parallax]');
const heroSection = document.getElementById('accueil');
if (bottles.length && heroSection) {
  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    bottles.forEach(b => {
      // Reset transform quand on sort du hero pour éviter tout débordement
      if (heroBottom <= 0) {
        b.style.transform = '';
        b.style.visibility = 'hidden';
      } else {
        b.style.visibility = 'visible';
      }
    });
  }, { passive: true });
}

/* ══════════════════════════════
   MENU OVERLAY
══════════════════════════════ */
const menu     = $('#menu');
const openBtn  = $('#openMenu');
const closeBtn = $('#closeMenu');
const appleCtx = $('#fallingApples');
const EMOJIS   = ['🍎','🍏','🍋','🌺','🌿','🍎'];

function createApples() {
  if (!appleCtx) return;
  appleCtx.innerHTML = '';
  const n = window.innerWidth < 600 ? 8 : 14;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.classList.add('apple-fall');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `font-size:${18 + Math.random() * 24}px`,
      `animation-duration:${3.5 + Math.random() * 3}s`,
      `animation-delay:${Math.random() * 1.8}s`,
      'pointer-events:none'
    ].join(';');
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
  setTimeout(() => closeBtn && closeBtn.focus(), 60);
}

function closeMenu() {
  menu.classList.remove('active');
  menu.setAttribute('aria-hidden', 'true');
  openBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  openBtn && openBtn.focus();
}

openBtn && openBtn.addEventListener('click', openMenu);

closeBtn && closeBtn.addEventListener('click', function (e) {
  e.preventDefault();
  e.stopPropagation();
  closeMenu();
});

$$('.menu-links a').forEach(a => a.addEventListener('click', closeMenu));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (menu && menu.classList.contains('active')) closeMenu();
    if (lightbox && lightbox.classList.contains('active')) closeLightbox();
    const rv = document.getElementById('revendeurModal');
    if (rv && rv.classList.contains('active')) closeRevendeur();
    closeContactDropdown();
  }
});

/* ── Dropdown Contact dans la nav ── */
const contactDropBtn  = $('#contactDropBtn');
const contactDropMenu = $('.nav-dropdown-menu');

function openContactDropdown() {
  if (!contactDropBtn || !contactDropMenu) return;
  contactDropMenu.classList.add('open');
  contactDropBtn.setAttribute('aria-expanded', 'true');
}
function closeContactDropdown() {
  if (!contactDropBtn || !contactDropMenu) return;
  contactDropMenu.classList.remove('open');
  contactDropBtn.setAttribute('aria-expanded', 'false');
}
function toggleContactDropdown() {
  if (contactDropMenu && contactDropMenu.classList.contains('open')) {
    closeContactDropdown();
  } else {
    openContactDropdown();
  }
}

contactDropBtn && contactDropBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleContactDropdown();
});
document.addEventListener('click', (e) => {
  if (contactDropBtn && !contactDropBtn.closest('.nav-dropdown').contains(e.target)) {
    closeContactDropdown();
  }
});

/* Liens dropdown : pré-sélectionner le type de contact et naviguer */
$$('.dropdown-link').forEach(link => {
  link.addEventListener('click', (e) => {
    closeContactDropdown();
    const type = link.dataset.contactType;
    if (type) {
      // Activer le bon onglet de contact après navigation
      setTimeout(() => activateContactType(type), 350);
    }
  });
});

/* ── Lightbox ── */
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
  const lbClose = $('#lightboxClose');
  lbClose && lbClose.focus();
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

const prevPhoto = () => { currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length; updateLightbox(); };
const nextPhoto = () => { currentIndex = (currentIndex + 1) % galleryItems.length; updateLightbox(); };

$$('.gallery-item[data-src]').forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
  });
});

$('#lightboxClose') && $('#lightboxClose').addEventListener('click', closeLightbox);
$('#lightboxPrev')  && $('#lightboxPrev').addEventListener('click', prevPhoto);
$('#lightboxNext')  && $('#lightboxNext').addEventListener('click', nextPhoto);
lightbox && lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

let touchStartX = 0;
if (lightbox) {
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto();
  });
}

/* ── Validation champ ── */
function validateField(input) {
  const field = input.closest('.field');
  const err   = field && field.querySelector('.field-error');
  if (!err) return true;
  err.textContent = '';
  if (input.required && !input.value.trim()) { err.textContent = 'Ce champ est requis.'; return false; }
  if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { err.textContent = 'Adresse email invalide.'; return false; }
  return true;
}

/* ── Sélecteur type de contact ── */
const contactTypeBtns = $$('.contact-type-btn');
const contactTypeHidden = $('#contactTypeHidden');
const contactFormTypeLabel = $('#contactFormTypeLabel');
const fieldEntreprise = $('#fieldEntreprise');

const typeLabels = {
  info: 'Demande de renseignements',
  prix: 'Demande de tarifs',
  revendeur: 'Demande partenariat revendeur'
};

function activateContactType(type) {
  contactTypeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  if (contactTypeHidden) contactTypeHidden.value = type;
  if (contactFormTypeLabel) contactFormTypeLabel.textContent = typeLabels[type] || '';
  // Afficher/masquer le champ entreprise pour les revendeurs
  if (fieldEntreprise) {
    fieldEntreprise.style.display = type === 'revendeur' ? 'block' : 'none';
    const inp = fieldEntreprise.querySelector('input');
    if (inp) inp.required = type === 'revendeur';
  }
}

contactTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => activateContactType(btn.dataset.type));
});

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
  const closeRv = document.getElementById('closeRevendeur');
  closeRv && closeRv.focus();
}
function closeRevendeur() {
  if (!rvModal) return;
  rvModal.classList.remove('active');
  rvModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('openRevendeur') && document.getElementById('openRevendeur').focus();
}

$$('[id^="openRevendeur"]').forEach(el => el.addEventListener('click', openRevendeur));
document.getElementById('closeRevendeur') && document.getElementById('closeRevendeur').addEventListener('click', closeRevendeur);
rvModal && rvModal.addEventListener('click', e => { if (e.target === rvModal) closeRevendeur(); });

/* Bouton section revendeur → ouvre la modal */
const openRvSection = $('#openRevendeurSection');
openRvSection && openRvSection.addEventListener('click', openRevendeur);

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