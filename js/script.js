'use strict';

// ==============================
// UTILITAIRES
// ==============================
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

// ==============================
// TOPBAR – EFFET SCROLL
// ==============================
const topbar = $('#topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ==============================
// MENU OVERLAY + POMMES TOMBANTES
// ==============================
const menu      = $('#menu');
const openBtn   = $('#openMenu');
const closeBtn  = $('#closeMenu');
const appleCtx  = $('#fallingApples');
const EMOJIS    = ['🍎', '🍏', '🍋', '🌺', '🌿', '🍎', '🍏', '🍋'];

function createApples() {
  if (!appleCtx) return;
  appleCtx.innerHTML = '';
  const n = window.innerWidth < 600 ? 12 : 22;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.classList.add('apple-fall');
    const size = 24 + Math.random() * 30;
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
  if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu();
});

// ==============================
// REVEAL AU SCROLL (Intersection Observer)
// ==============================
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revObs.observe(el));

// ==============================
// BON DE COMMANDE – CALCUL INTERACTIF
// ==============================
function formatEur(val) {
  return val.toFixed(2).replace('.', ',') + ' €';
}

function updateTotals() {
  let total = 0;
  $$('.qty-input').forEach(inp => {
    const qty   = Math.max(0, parseInt(inp.value) || 0);
    inp.value   = qty;
    const price = parseFloat(inp.dataset.price);
    const amt   = qty * price;
    total += amt;
    const amtCell = inp.closest('tr').querySelector('.amount');
    if (amtCell) amtCell.textContent = formatEur(amt);
  });
  const totalEl = document.getElementById('totalAmount');
  if (totalEl) totalEl.textContent = formatEur(total);
}

$$('.qty-input').forEach(inp => {
  inp.addEventListener('input',  updateTotals);
  inp.addEventListener('change', updateTotals);
});

// ==============================
// FORMULAIRE DE CONTACT
// ==============================
const contactForm = $('#contactForm');
const formSuccess = $('#formSuccess');

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

if (contactForm) {
  $$('input, textarea', contactForm).forEach(inp =>
    inp.addEventListener('blur', () => validateField(inp))
  );

  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input[required], textarea[required]', contactForm).forEach(inp => {
      if (!validateField(inp)) valid = false;
    });
    if (!valid) return;

    const btn = contactForm.querySelector('.btn-submit');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      if (formSuccess) {
        formSuccess.textContent = '✓ Message bien reçu ! Nous vous répondrons dans les plus brefs délais. 🍎';
      }
      contactForm.reset();
      btn.innerHTML = '<span>Envoyer le message</span><span>→</span>';
      btn.disabled = false;
    }, 1200);
  });
}

// ==============================
// FOOTER – ANNÉE DYNAMIQUE
// ==============================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();