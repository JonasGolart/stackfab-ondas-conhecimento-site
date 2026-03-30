/* ═══════════════════════════════════════════════════════
   ONDAS DO CONHECIMENTO — JavaScript
   Scroll animations, form validation, counter, menu
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  initCounter();
  initForm();
  initCurrentYear();
});

/* ══════════════════════════════════════════════════
   HEADER — scroll effect
   ══════════════════════════════════════════════════ */
function initHeader() {
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });
}

/* ══════════════════════════════════════════════════
   MOBILE MENU
   ══════════════════════════════════════════════════ */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const links = nav.querySelectorAll('.header__nav-link');

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ══════════════════════════════════════════════════
   SCROLL ANIMATIONS — IntersectionObserver
   ══════════════════════════════════════════════════ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');

  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════════════
   COUNTER — animate stats on scroll
   ══════════════════════════════════════════════════ */
function initCounter() {
  const counters = document.querySelectorAll('[data-count]');

  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: ease-out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(eased * target);

    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Append + or % if appropriate
      if (target === 100) el.textContent = target + '%';
      else if (target >= 50) el.textContent = target + '+';
    }
  }

  requestAnimationFrame(update);
}

/* ══════════════════════════════════════════════════
   FORM VALIDATION
   ══════════════════════════════════════════════════ */
function initForm() {
  const form = document.getElementById('form-inscricao');
  if (!form) return;

  const fields = {
    grupo: {
      required: true,
      minLength: 3,
      errorMsg: 'Nome do grupo é obrigatório (mínimo 3 caracteres).'
    },
    cidade: {
      required: true,
      minLength: 2,
      errorMsg: 'Informe a cidade.'
    },
    participantes: {
      required: true,
      type: 'number',
      min: 1,
      errorMsg: 'Informe o número de participantes (mínimo 1).'
    },
    responsavel: {
      required: true,
      minLength: 3,
      errorMsg: 'Nome do responsável é obrigatório.'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMsg: 'Informe um e-mail válido.'
    },
    telefone: {
      required: true,
      pattern: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
      errorMsg: 'Informe um telefone válido. Ex: (41) 99999-9999'
    }
  };

  // Real-time validation on blur
  Object.keys(fields).forEach(name => {
    const input = document.getElementById(name);
    if (!input) return;

    input.addEventListener('blur', () => {
      validateField(name, input, fields[name]);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateField(name, input, fields[name]);
      }
    });
  });

  // Phone mask
  const phoneInput = document.getElementById('telefone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 6) {
        v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        v = `(${v.slice(0,2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        v = `(${v}`;
      }
      e.target.value = v;
    });
  }

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    Object.keys(fields).forEach(name => {
      const input = document.getElementById(name);
      if (!validateField(name, input, fields[name])) {
        isValid = false;
      }
    });

    if (!isValid) {
      // Scroll to first error
      const firstError = form.querySelector('.form__input.error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Envio real para a planilha via Google Apps Script
    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Enviando...
    `;

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1T5CmnUChGtbLyfRcxCkMU23pgEwoFLoreA2YDrbHbEag4uHKep14fOnpy4FNtLav/exec';
    
    // Converte os dados do formulário para o formato que o Apps Script entende
    const formData = new FormData(form);
    const formDataEncoded = new URLSearchParams(formData).toString();

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formDataEncoded,
    })
    .then(response => {
      showToast();
      form.reset();
      
      // Remove validation classes
      form.querySelectorAll('.form__input').forEach(input => {
        input.classList.remove('success', 'error');
      });
      form.querySelectorAll('.form__error').forEach(el => {
        el.textContent = '';
      });
    })
    .catch(error => {
      console.error('Erro ao enviar:', error);
      alert('Ocorreu um problema de conexão com a planilha. Tente novamente mais tarde.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Enviar Inscrição
      `;
    });
  });
}

function validateField(name, input, rules) {
  const errorEl = document.getElementById(`${name}-error`);
  const value = input.value.trim();

  let valid = true;

  if (rules.required && !value) {
    valid = false;
  } else if (rules.minLength && value.length < rules.minLength) {
    valid = false;
  } else if (rules.pattern && !rules.pattern.test(value)) {
    valid = false;
  } else if (rules.type === 'number' && (isNaN(value) || parseInt(value) < (rules.min || 0))) {
    valid = false;
  }

  if (!valid) {
    input.classList.add('error');
    input.classList.remove('success');
    if (errorEl) errorEl.textContent = rules.errorMsg;
  } else {
    input.classList.remove('error');
    input.classList.add('success');
    if (errorEl) errorEl.textContent = '';
  }

  return valid;
}

/* ══════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════ */
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/* ══════════════════════════════════════════════════
   CURRENT YEAR
   ══════════════════════════════════════════════════ */
function initCurrentYear() {
  const el = document.getElementById('current-year');
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}
