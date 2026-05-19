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
  initAuth();
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
  initGroupForm();
  initIndividualForm();
}

function initGroupForm() {
  const form = document.getElementById('form-inscricao-grupo');
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

    // Envio real para a nossa API Node.js
    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Enviando...
    `;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/inscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(async response => {
      if (!response.ok) throw new Error('Erro ao enviar');
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
      alert('Ocorreu um problema ao salvar sua inscrição. Verifique se o servidor está rodando.');
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

function initIndividualForm() {
  const form = document.getElementById('form-inscricao-individual');
  if (!form) return;

  const fields = {
    'ind-nome': { required: true, minLength: 3, errorMsg: 'Nome é obrigatório.' },
    'ind-email': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMsg: 'E-mail inválido.' },
    'ind-telefone': { required: true, pattern: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, errorMsg: 'Telefone inválido.' }
  };

  Object.keys(fields).forEach(name => {
    const input = document.getElementById(name);
    if (!input) return;

    input.addEventListener('blur', () => validateField(name, input, fields[name]));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(name, input, fields[name]);
    });
  });

  const phoneInput = document.getElementById('ind-telefone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
      else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
      else if (v.length > 0) v = `(${v}`;
      e.target.value = v;
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;
    Object.keys(fields).forEach(name => {
      const input = document.getElementById(name);
      if (!validateField(name, input, fields[name])) isValid = false;
    });

    if (!isValid) return;

    const btn = document.getElementById('btn-enviar-individual');
    btn.disabled = true;
    btn.innerHTML = `Enviando...`;

    const data = {
      nome: document.getElementById('ind-nome').value,
      email: document.getElementById('ind-email').value,
      telefone: document.getElementById('ind-telefone').value
    };

    fetch('/api/inscriptions/individual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(async response => {
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Erro ao enviar');
      
      form.reset();
      form.querySelectorAll('.form__input').forEach(i => i.classList.remove('success', 'error'));
      
      alert(resData.message);
    })
    .catch(error => alert(error.message))
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Garantir Acesso Imediato
      `;
    });
  });
}

/* ══════════════════════════════════════════════════
   AUTHENTICATION & DASHBOARD
   ══════════════════════════════════════════════════ */
function initAuth() {
  const loginTrigger = document.getElementById('login-trigger');
  const loginModal = document.getElementById('login-modal');
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  
  const loginForm = document.getElementById('login-form');
  const dashboardModal = document.getElementById('dashboard-modal');
  const dashboardClose = document.getElementById('dashboard-close');
  const dashboardOverlay = document.getElementById('dashboard-overlay');
  const btnLogout = document.getElementById('btn-logout');

  // Toggle Login Modal
  loginTrigger.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (token) {
      showDashboard();
    } else {
      loginModal.classList.add('show');
    }
  });

  [modalClose, modalOverlay].forEach(el => {
    el.addEventListener('click', () => loginModal.classList.remove('show'));
  });

  [dashboardClose, dashboardOverlay].forEach(el => {
    el.addEventListener('click', () => dashboardModal.classList.remove('show'));
  });

  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.textContent = 'Autenticando...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        loginModal.classList.remove('show');
        showDashboard();
      } else {
        alert(data.error || 'Erro no login');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    dashboardModal.classList.remove('show');
  });
}

async function showDashboard() {
  const dashboardModal = document.getElementById('dashboard-modal');
  const inscriptionsList = document.getElementById('inscriptions-list');
  const totalEl = document.getElementById('total-inscriptions');
  const token = localStorage.getItem('token');

  if (!token) return;

  dashboardModal.classList.add('show');
  inscriptionsList.innerHTML = '<tr><td colspan="5" style="text-align:center">Carregando...</td></tr>';

  try {
    const response = await fetch('/api/admin/inscriptions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      dashboardModal.classList.remove('show');
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    const data = await response.json();
    totalEl.textContent = data.length;

    inscriptionsList.innerHTML = data.map(item => `
      <tr>
        <td>${new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
        <td><strong>${item.group_name}</strong></td>
        <td>${item.city}</td>
        <td>${item.responsible_name}</td>
        <td>
          <div style="font-size: 0.8rem">${item.email}</div>
          <div style="font-size: 0.8rem">${item.phone}</div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center">Nenhuma inscrição encontrada.</td></tr>';

  } catch (err) {
    inscriptionsList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red">Erro ao carregar dados.</td></tr>';
  }
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
