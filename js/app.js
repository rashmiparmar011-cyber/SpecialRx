/* ============================================
   B&S Special – Main Application Logic
   ============================================ */

// ============ STATE ============
let currentScreen = 'screen-splash';
let currentPage = 'page-home';
let selectedPharmacy = PHARMACIES[0];
let cart = [];
let rxUploaded = false;
let latestOrderId = '';
let currentOrderTab = 'active';
let otpTimerInterval = null;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  updateTime();
  setInterval(updateTime, 60000);

  // Splash screen auto-transition
  setTimeout(() => {
    navigateTo('screen-login');
  }, 3000);

  // Setup forms
  setupLoginForm();
  setupRegisterForm();
  setupForgotForm();
  setupOTPInputs();

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('login-email-fields').classList.toggle('hidden', tabName !== 'email');
      document.getElementById('login-otp-fields').classList.toggle('hidden', tabName !== 'otp');
    });
  });

  // Render initial data
  renderPharmacyList();
  renderNotifications();
  updateGreeting();
}

// ============ NAVIGATION ============
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    currentScreen = screenId;
  }

  // Initialize content when navigating to main
  if (screenId === 'screen-main') {
    renderDashboard();
    renderProductsGrid();
    updateCartBadge();
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    currentPage = pageId;
  }

  // Initialize page content
  if (pageId === 'page-cart') renderCart();
  if (pageId === 'page-orders') renderOrders();
  if (pageId === 'page-help') setSupportTab('product-support');
  if (pageId === 'page-notifications') renderNotifications();
  if (pageId === 'page-search') renderProductsGrid();
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');

  const pageMap = {
    home: 'page-home',
    search: 'page-search',
    cart: 'page-cart',
    orders: 'page-orders',
    account: 'page-account'
  };
  if (pageMap[tabName]) showPage(pageMap[tabName]);
}

// ============ TIME & GREETING ============
function updateTime() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const el = document.getElementById('status-time');
  if (el) el.textContent = `${h}:${m}`;
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Greetings From B&S';
  if (hour >= 12 && hour < 17) greeting = 'Greetings from B&S';
  else if (hour >= 17) greeting = 'Greetings from B&S';
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = greeting;
}

// ============ LOGIN ============
function setupLoginForm() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const emailError = document.getElementById('login-email-error');
    const passwordError = document.getElementById('login-password-error');

    emailError.textContent = '';
    passwordError.textContent = '';
    email.closest('.input-wrapper').classList.remove('error');
    password.closest('.input-wrapper').classList.remove('error');

    if (!email.value.trim()) {
      emailError.textContent = 'Email address is required';
      email.closest('.input-wrapper').classList.add('error');
      valid = false;
    } else if (!isValidEmail(email.value)) {
      emailError.textContent = 'Please enter a valid email address';
      email.closest('.input-wrapper').classList.add('error');
      valid = false;
    }

    if (!password.value.trim()) {
      passwordError.textContent = 'Password is required';
      password.closest('.input-wrapper').classList.add('error');
      valid = false;
    } else if (password.value.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      password.closest('.input-wrapper').classList.add('error');
      valid = false;
    }

    if (valid) {
      showLoading('Signing in...');
      setTimeout(() => {
        hideLoading();
        navigateTo('screen-select-pharmacy');
      }, 1500);
    }
  });
}

function biometricLogin() {
  showLoading('Verifying biometrics...');
  setTimeout(() => {
    hideLoading();
    showToast('Biometric verified successfully', 'success');
    setTimeout(() => navigateTo('screen-select-pharmacy'), 600);
  }, 2000);
}

function sendLoginOTP() {
  showLoading('Sending OTP...');
  setTimeout(() => {
    hideLoading();
    document.getElementById('login-otp-entry').classList.remove('hidden');
    showToast('OTP sent to your mobile', 'success');
  }, 1200);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

// ============ REGISTRATION ============
function setupRegisterForm() {
  const form = document.getElementById('register-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      // Pharmacy Details Section
      { id: 'reg-pharmacy-name', errorId: 'reg-pharmacy-name-error', msg: 'Pharmacy Name is required', validate: v => v.trim().length > 0 },
      { id: 'reg-pharmacy-gphc', errorId: 'reg-pharmacy-gphc-error', msg: 'GPhC Number is required', validate: v => v.trim().length > 0 },
      { id: 'reg-org-code', errorId: 'reg-org-code-error', msg: 'Organization Code is required', validate: v => v.trim().length > 0 },
      { id: 'reg-pharmacy-email', errorId: 'reg-pharmacy-email-error', msg: 'Valid pharmacy email address required', validate: v => isValidEmail(v) },
      { id: 'reg-contact', errorId: 'reg-contact-error', msg: 'Contact Number is required', validate: v => v.trim().length > 0 },
      { id: 'reg-postcode', errorId: 'reg-postcode-error', msg: 'Postcode is required', validate: v => v.trim().length > 0 },

      // Personal Details Section
      { id: 'reg-director-name', errorId: 'reg-director-name-error', msg: 'Director Name is required', validate: v => v.trim().length > 0 },
      { id: 'reg-company-reg', errorId: 'reg-company-reg-error', msg: 'Company Registration Number is required', validate: v => v.trim().length > 0 }
    ];

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const err = document.getElementById(f.errorId);
      err.textContent = '';
      const wrapper = el.closest('.input-wrapper') || el.closest('.textarea-wrapper');
      if (wrapper) wrapper.classList.remove('error');
      if (!f.validate(el.value)) {
        err.textContent = f.msg;
        if (wrapper) wrapper.classList.add('error');
        valid = false;
      }
    });

    // Terms
    const terms = document.getElementById('reg-terms');
    const termsErr = document.getElementById('reg-terms-error');
    termsErr.textContent = '';
    if (!terms.checked) {
      termsErr.textContent = 'You must accept the Terms & Conditions';
      valid = false;
    }

    if (valid) {
      showLoading('Creating your account...');
      setTimeout(() => {
        hideLoading();
        navigateTo('screen-otp');
        startOTPTimer();
      }, 1800);
    }
  });
}

function updatePasswordStrength(password) {
  const bars = document.querySelectorAll('.strength-bar');
  const text = document.querySelector('.strength-text');
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < strength) {
      if (strength <= 1) bar.classList.add('weak');
      else if (strength <= 2) bar.classList.add('medium');
      else bar.classList.add('strong');
    }
  });

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  text.textContent = labels[strength] || 'Password Strength';
}

// ============ OTP ============
function setupOTPInputs() {
  document.querySelectorAll('.otp-box').forEach(box => {
    box.addEventListener('input', (e) => {
      if (e.target.value.length === 1) {
        const next = e.target.nextElementSibling;
        if (next && next.classList.contains('otp-box')) next.focus();
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value) {
        const prev = e.target.previousElementSibling;
        if (prev && prev.classList.contains('otp-box')) prev.focus();
      }
    });
  });
}

function startOTPTimer() {
  let seconds = 30;
  const countdown = document.getElementById('otp-countdown');
  const timerText = document.getElementById('otp-timer-text');
  const resendBtn = document.getElementById('resend-otp-btn');

  timerText.classList.remove('hidden');
  resendBtn.classList.add('hidden');

  if (otpTimerInterval) clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    seconds--;
    countdown.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(otpTimerInterval);
      timerText.classList.add('hidden');
      resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

function resendOTP() {
  showToast('OTP resent to your mobile', 'success');
  startOTPTimer();
}

function verifyOTP() {
  const boxes = document.querySelectorAll('[data-otp-reg]');
  let otp = '';
  boxes.forEach(b => otp += b.value);

  if (otp.length < 6) {
    showToast('Please enter the complete 6-digit OTP', 'error');
    return;
  }

  showLoading('Verifying...');
  setTimeout(() => {
    hideLoading();
    showToast('Account verified successfully!', 'success');
    setTimeout(() => navigateTo('screen-login'), 800);
  }, 1500);
}

// ============ FORGOT PASSWORD ============
function setupForgotForm() {
  const form = document.getElementById('forgot-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    showLoading('Sending reset link...');
    setTimeout(() => {
      hideLoading();
      form.classList.add('hidden');
      document.getElementById('forgot-success').classList.remove('hidden');
    }, 1500);
  });
}

// ============ PHARMACY SELECTION ============
function renderPharmacyList() {
  const container = document.getElementById('pharmacy-list');
  container.innerHTML = PHARMACIES.map(ph => `
    <div class="pharmacy-card fade-in" onclick="selectPharmacy('${ph.id}')">
      <div class="pc-name">${ph.name}</div>
      <div class="pc-gphc">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${ph.gphc}
      </div>
      <div class="pc-address">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${ph.address}</span>
      </div>
    </div>
  `).join('');
}

function filterPharmacies(query) {
  const cards = document.querySelectorAll('.pharmacy-card');
  const q = query.toLowerCase();
  cards.forEach((card, i) => {
    const name = PHARMACIES[i].name.toLowerCase();
    const gphc = PHARMACIES[i].gphc.toLowerCase();
    card.style.display = (name.includes(q) || gphc.includes(q)) ? '' : 'none';
  });
}

function selectPharmacy(id) {
  selectedPharmacy = PHARMACIES.find(p => p.id === id);
  document.querySelectorAll('.pharmacy-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  showLoading('Loading dashboard...');
  setTimeout(() => {
    hideLoading();
    document.getElementById('selected-pharmacy-name').textContent = selectedPharmacy.name;
    document.getElementById('pharmacy-pill-name').textContent = selectedPharmacy.name;
    document.getElementById('account-name').textContent = selectedPharmacy.name;

    const avatar = document.querySelector('.account-avatar span');
    if (avatar) avatar.textContent = selectedPharmacy.initials;
    const navAvatar = document.querySelector('.avatar span');
    if (navAvatar) navAvatar.textContent = selectedPharmacy.initials;

    navigateTo('screen-main');
    showPage('page-home');
    switchTab('home');
  }, 1200);
}

// ============ DASHBOARD ============
function renderDashboard() {
  updateGreeting();
  renderRecentOrders();
}

function renderRecentOrders() {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;
  const recentOrders = ORDERS.slice(0, 3);
  container.innerHTML = recentOrders.map(order => createOrderCard(order, true)).join('');
}

// ============ PRODUCT SEARCH & LISTING ============
function getCartItem(medId) {
  return cart.find(c => c.id === medId);
}

function renderProductsGrid(medicines) {
  const container = document.getElementById('products-grid');
  if (!container) return;
  const data = medicines || MEDICINES;
  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No medicines found</h3>
        <p>Try adjusting your search or filters</p>
      </div>`;
    return;
  }
  container.innerHTML = data.map(med => {
    const cartItem = getCartItem(med.id);
    const inCart = !!cartItem;
    const qty = inCart ? cartItem.qty : 0;

    return `
    <div class="product-card fade-in ${inCart ? 'in-cart' : ''}">
      <div class="product-card-main" onclick="showProductDetail('${med.id}')">
        <div class="product-info">
          <div class="p-name">${med.name}</div>
          <div class="p-meta" style="display: flex; align-items: center; gap: 8px; margin-top: 6px; margin-bottom: 6px; flex-wrap: wrap;">
            <span class="p-category" style="margin-bottom: 0;">${med.categoryLabel}</span>
            <span style="color: var(--text-muted); font-size: 12px; display: flex; align-items: center;">•</span>
            <span class="p-packsize" style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">${med.packSize}</span>
          </div>
          <div class="p-details" style="margin-top: 6px;">
            ${med.rxRequired ? '<span class="product-rx-tag">Prescription Required</span>' : ''}
          </div>
        </div>
      </div>
      <div class="product-card-actions" onclick="event.stopPropagation();">
        ${inCart ? `
          <button class="pc-remove-btn" onclick="removeFromSearch('${med.id}')" title="Remove from cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <div class="pc-qty-control">
            <button class="pc-qty-btn" onclick="changeSearchQty('${med.id}', -1)">−</button>
            <span class="pc-qty-value">${qty}</span>
            <button class="pc-qty-btn" onclick="changeSearchQty('${med.id}', 1)">+</button>
          </div>
        ` : `
          <button class="pc-add-btn" onclick="addFromSearch('${med.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        `}
      </div>
    </div>
  `;
  }).join('');
}

// Search-page cart actions (re-render product grid to reflect changes)
function addFromSearch(medId) {
  const med = MEDICINES.find(m => m.id === medId);
  if (!med) return;

  const existing = cart.find(c => c.id === medId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...med, qty: 1, notes: '' });
  }

  updateCartBadge();
  showToast(`${med.name.substring(0, 30)}... added to cart`, 'success');
  refreshProductsGrid();
}

function changeSearchQty(medId, delta) {
  const item = cart.find(c => c.id === medId);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromSearch(medId);
    return;
  }
  item.qty = newQty;
  updateCartBadge();
  refreshProductsGrid();
}

function removeFromSearch(medId) {
  const med = cart.find(c => c.id === medId);
  cart = cart.filter(c => c.id !== medId);
  updateCartBadge();
  if (med) showToast(`${med.name.substring(0, 30)}... removed from cart`, 'info');
  refreshProductsGrid();
}

// Re-renders the product grid while preserving current search/filter state
function refreshProductsGrid() {
  const searchVal = document.getElementById('medicine-search')?.value?.toLowerCase() || '';
  const activeCat = document.querySelector('.cat-tab.active')?.dataset?.cat || 'all';

  let filtered = MEDICINES;
  if (activeCat !== 'all') filtered = filtered.filter(m => m.category === activeCat);
  if (searchVal) filtered = filtered.filter(m =>
    m.name.toLowerCase().includes(searchVal) ||
    m.code.toLowerCase().includes(searchVal) ||
    m.categoryLabel.toLowerCase().includes(searchVal)
  );
  renderProductsGrid(filtered);
}

function searchMedicines(query) {
  const q = query.toLowerCase();
  const filtered = MEDICINES.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.code.toLowerCase().includes(q) ||
    m.categoryLabel.toLowerCase().includes(q)
  );
  renderProductsGrid(filtered);
}

function filterByCategory(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const searchVal = document.getElementById('medicine-search').value.toLowerCase();
  let filtered = MEDICINES;
  if (cat !== 'all') filtered = MEDICINES.filter(m => m.category === cat);
  if (searchVal) filtered = filtered.filter(m =>
    m.name.toLowerCase().includes(searchVal) ||
    m.code.toLowerCase().includes(searchVal)
  );
  renderProductsGrid(filtered);
}

function toggleFilterPanel() {
  document.getElementById('filter-panel').classList.toggle('hidden');
}

function toggleChip(btn) {
  const parent = btn.closest('.filter-chips');
  parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

// ============ PRODUCT DETAIL ============
function showProductDetail(medId) {
  const med = MEDICINES.find(m => m.id === medId);
  if (!med) return;

  const container = document.getElementById('product-detail-content');
  container.innerHTML = `
    <div class="product-detail fade-in">
      <h2 class="pd-name" style="margin-bottom: 16px;">${med.name}</h2>
      <p class="pd-description">${med.description}</p>
      <div class="pd-info-grid">
        <div class="pd-info-item">
          <span>Category</span>
          <strong>${med.categoryLabel}</strong>
        </div>
        <div class="pd-info-item">
          <span>Pack Size</span>
          <strong>${med.packSize}</strong>
        </div>
        <div class="pd-info-item">
          <span>Storage</span>
          <strong style="font-size:12px;">${med.storage}</strong>
        </div>
        <div class="pd-info-item">
          <span>Status</span>
          <strong style="color:${med.rxRequired ? 'var(--info)' : 'var(--text-secondary)'};">${med.rxRequired ? 'Prescription Required' : 'Non-Prescription'}</strong>
        </div>
      </div>
      <div class="pd-actions">
        <button class="btn btn-primary" onclick="addToCart('${med.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
        <button class="btn btn-outline" onclick="showQueryModal('${med.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Query
        </button>
      </div>
    </div>
  `;
  showPage('page-product-detail');
}

function showQueryModal(medId) {
  const med = MEDICINES.find(m => m.id === medId);
  const content = `
    <h3>Product Inquiry</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Submit a query about <strong>${med.name}</strong></p>
    <div class="form-group">
      <label>Your Query</label>
      <div class="input-wrapper textarea-wrapper">
        <textarea id="query-text" placeholder="Type your question or inquiry..." rows="4"></textarea>
      </div>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitQuery()">Submit Query</button>
  `;
  openModal(content);
}

function submitQuery() {
  const text = document.getElementById('query-text').value;
  if (!text.trim()) {
    showToast('Please enter your query', 'error');
    return;
  }
  closeModal();
  showToast('Query submitted successfully', 'success');
}

// ============ CART ============
function addToCart(medId) {
  const med = MEDICINES.find(m => m.id === medId);
  if (!med) return;

  const existing = cart.find(c => c.id === medId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...med, qty: 1, notes: '' });
  }

  updateCartBadge();
  showToast(`${med.name.substring(0, 30)}... added to cart`, 'success');
}

function removeFromCart(medId) {
  cart = cart.filter(c => c.id !== medId);
  updateCartBadge();
  renderCart();
}

function updateCartQty(medId, delta) {
  const item = cart.find(c => c.id === medId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
}

function updateCartBadge() {
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  const badge = document.getElementById('cart-badge');
  const headerCount = document.getElementById('cart-header-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  if (headerCount) headerCount.textContent = count;
}

function renderCart() {
  const container = document.getElementById('cart-content');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p>Browse medicines and add items to your cart</p>
        <button class="btn btn-primary" onclick="switchTab('search')">Browse Medicines</button>
      </div>`;
    return;
  }

  const hasRxItems = cart.some(c => c.rxRequired);

  let html = '<div class="cart-content">';

  // Cart Items
  cart.forEach(item => {
    html += `
      <div class="cart-item fade-in">
        <div class="cart-item-top">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <span class="cart-item-category">${item.categoryLabel}</span>
            ${item.rxRequired ? '<span class="cart-item-rx">Rx</span>' : ''}
          </div>
          <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="cart-item-bottom">
          <div class="quantity-control">
            <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">−</button>
            <div class="qty-display">${item.qty}</div>
            <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
          </div>
          <span class="cart-item-pack">${item.packSize}</span>
        </div>
        <textarea class="cart-notes-input" placeholder="Add notes (optional)" rows="1" oninput="updateCartNote('${item.id}', this.value)">${item.notes}</textarea>
      </div>
    `;
  });

  // Prescription Upload (if Rx items)
  if (hasRxItems) {
    html += `
      <div class="cart-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Upload Prescription
        </h4>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Optional for Rx medicines in your cart</p>
        <div class="upload-area" onclick="simulateUpload()" id="upload-area">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p>Tap to upload prescription</p>
          <p class="upload-formats">PDF, JPG, PNG (Max 10MB)</p>
        </div>
        <div id="upload-success-area" class="${rxUploaded ? '' : 'hidden'}">
          <div class="upload-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>prescription_scan.pdf uploaded successfully</span>
          </div>
        </div>
      </div>
    `;
  }

  // Delivery Address
  html += `
    <div class="cart-section fade-in">
      <h4>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Delivery Address
      </h4>
      <div style="background:var(--primary-bg);padding:12px 14px;border-radius:var(--radius-md);border:1px solid var(--border-light);margin-top:10px;">
        <strong style="display:block;font-size:14px;color:var(--text-primary);margin-bottom:4px;">${selectedPharmacy.name}</strong>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.4;margin:0;">${selectedPharmacy.address}</p>
      </div>
    </div>
  `;

  // GPhC Verification
  html += `
    <div class="cart-section">
      <h4>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Pharmacist Verification
      </h4>
      <div class="form-group">
        <label>GPhC Registration Number <span class="required">*</span></label>
        <div class="input-wrapper">
          <input type="text" id="cart-gphc" placeholder="Enter GPhC number" value="2087654" />
        </div>
      </div>
      <div class="form-group">
        <label>Pharmacist Name <span class="required">*</span></label>
        <div class="input-wrapper">
          <input type="text" id="cart-pharmacist" placeholder="Enter pharmacist name" value="Dr. Sarah Mitchell" />
        </div>
      </div>
    </div>
  `;

  // Declarations
  html += `
    <div class="cart-section">
      <h4>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Mandatory Declarations
      </h4>
      <div class="declaration-checkbox">
        <input type="checkbox" id="declaration-1" />
        <label for="declaration-1">I confirm that the above item(s) are required by the pharmacy detailed above.</label>
      </div>
      <div class="declaration-checkbox">
        <input type="checkbox" id="declaration-2" />
        <label for="declaration-2">I confirm this is a bona fide request for this unlicensed medicine and there is a special clinical need for this item.</label>
      </div>
    </div>
  `;

  // Place Order Button
  html += `
    <div style="padding:20px 0;">
      <button class="btn btn-accent btn-full" onclick="placeOrder()" style="padding:16px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Place Order
      </button>
    </div>
  `;

  html += '</div>';
  container.innerHTML = html;
  updateCartBadge();
}

function updateCartNote(medId, note) {
  const item = cart.find(c => c.id === medId);
  if (item) item.notes = note;
}

function simulateUpload() {
  showLoading('Uploading prescription...');
  setTimeout(() => {
    hideLoading();
    rxUploaded = true;
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('upload-success-area').classList.remove('hidden');
    showToast('Prescription uploaded successfully', 'success');
  }, 1800);
}

function placeOrder() {
  // Validate
  const hasRxItems = cart.some(c => c.rxRequired);
  const gphc = document.getElementById('cart-gphc')?.value?.trim();
  const pharmacist = document.getElementById('cart-pharmacist')?.value?.trim();
  const dec1 = document.getElementById('declaration-1')?.checked;
  const dec2 = document.getElementById('declaration-2')?.checked;

  if (!gphc) {
    showToast('GPhC Registration Number is required', 'error');
    return;
  }
  if (!/^\d{7}$/.test(gphc)) {
    showToast('Invalid GPhC number. Must be 7 digits.', 'error');
    return;
  }
  if (!pharmacist) {
    showToast('Pharmacist name is required', 'error');
    return;
  }
  if (!dec1 || !dec2) {
    showToast('Please accept all mandatory declarations', 'error');
    return;
  }

  showLoading('Submitting your order...');
  setTimeout(() => {
    hideLoading();

    // Generate order ID
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(Math.floor(Math.random() * 100)).padStart(4, '0');
    latestOrderId = `SRX-${dateStr}-${seq}`;
    document.getElementById('success-order-id').textContent = latestOrderId;

    // Add to orders list
    const newOrder = {
      id: latestOrderId,
      date: formatDate(now),
      dateShort: formatDateShort(now),
      pharmacy: selectedPharmacy.name,
      items: cart.map(c => ({ name: c.name, qty: c.qty, packSize: c.packSize })),
      status: 'pending',
      statusLabel: 'Order Received',
      statusClass: 'status-received',
      trackingStep: 0,
      estimatedDelivery: formatDate(new Date(now.getTime() + 3 * 86400000))
    };
    ORDERS.unshift(newOrder);

    // Clear cart
    cart = [];
    rxUploaded = false;
    updateCartBadge();

    showPage('page-order-success');
  }, 2500);
}

// ============ ORDERS ============
function renderOrders() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  const statusMap = {
    active: ['transit', 'dispatched', 'processing', 'approved'],
    pending: ['pending'],
    repeat: ['delivered'],
    hold: ['hold'],
    cancelled: ['cancelled'],
    delivered: ['delivered']
  };

  const statuses = statusMap[currentOrderTab] || [];
  const filtered = ORDERS.filter(o => statuses.includes(o.status));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>No orders found</h3>
        <p>Orders in this category will appear here</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(order => createOrderCard(order, false)).join('');
}

function setOrderTab(tab) {
  currentOrderTab = tab;
  document.querySelectorAll('#order-tabs .order-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.otab === tab);
  });
  renderOrders();
}

function createOrderCard(order, isRecent) {
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
  const showActions = !isRecent;

  return `
    <div class="order-card fade-in" onclick="viewOrderTracking('${order.id}')">
      <div class="order-card-top">
        <div>
          <div class="order-id">${order.id}</div>
          <div class="order-date">${order.date}</div>
        </div>
        <span class="status-pill ${order.statusClass}">${order.statusLabel}</span>
      </div>
      <div class="order-card-body">
        <div>
          <div class="order-pharmacy">${order.pharmacy}</div>
          <div class="order-items-count">${itemCount} item${itemCount > 1 ? 's' : ''} • ${order.items.length} medicine${order.items.length > 1 ? 's' : ''}</div>
          <div class="order-products-list" style="margin-top: 10px; border-top: 1px dashed var(--border-light); padding-top: 8px;">
            ${order.items.map(item => `
              <div class="order-product-item" style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-top:4px; color:var(--text-secondary);">
                <span style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:85%;">• ${item.name}</span>
                <span style="font-weight:600; color:var(--text-primary); margin-left:8px;">x${item.qty}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ${showActions ? `
      <div class="order-card-actions">
        <button class="order-action-btn primary" onclick="event.stopPropagation();viewOrderTracking('${order.id}')">Track</button>
        <button class="order-action-btn primary" onclick="event.stopPropagation();reorderFlow('${order.id}')">Re-order</button>
        ${order.status === 'delivered' ? `<button class="order-action-btn secondary" onclick="event.stopPropagation();downloadInvoice('${order.id}')">Invoice</button>` : ''}
      </div>` : ''}
    </div>
  `;
}

// ============ ORDER TRACKING ============
function viewOrderTracking(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;

  const container = document.getElementById('order-tracking-content');
  let html = '<div class="tracking-content fade-in">';

  // Header
  html += `
    <div class="tracking-header">
      <div class="th-order-id">${order.id}</div>
      <div class="th-date">Ordered on ${order.date}</div>
      <div class="th-estimated">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Estimated Delivery: ${order.estimatedDelivery}
      </div>
    </div>
  `;

  // Items
  html += '<div class="tracking-header" style="margin-bottom:20px;"><h4 style="font-size:14px;font-weight:700;margin-bottom:12px;">Order Items</h4>';
  order.items.forEach(item => {
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px;"><span style="color:var(--text-secondary);">${item.name}</span><span style="font-weight:600;">x${item.qty}</span></div>`;
  });
  html += '</div>';

  // Delivery Address Card
  const pharmacyObj = PHARMACIES.find(p => p.name === order.pharmacy) || selectedPharmacy;
  html += `
    <div class="tracking-header" style="margin-bottom:20px;">
      <h4 style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--primary);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Delivery Address
      </h4>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.4;">
        <strong style="color:var(--text-primary);display:block;margin-bottom:4px;">${pharmacyObj.name}</strong>
        <div>${pharmacyObj.address}</div>
      </div>
    </div>
  `;

  // Timeline
  html += '<div class="tracking-timeline"><h4 style="font-size:14px;font-weight:700;margin-bottom:16px;">Order Timeline</h4>';

  TRACKING_STEPS.forEach((step, i) => {
    let dotClass = 'pending';
    let itemClass = '';
    if (i < order.trackingStep) { dotClass = 'completed'; itemClass = 'completed'; }
    else if (i === order.trackingStep) { dotClass = 'active'; itemClass = 'active'; }

    const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    const activeIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>';
    const pendingIcon = '<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.3"><circle cx="12" cy="12" r="4"/></svg>';

    let icon = pendingIcon;
    if (dotClass === 'completed') icon = checkIcon;
    if (dotClass === 'active') icon = activeIcon;

    html += `
      <div class="timeline-item ${itemClass}">
        <div class="timeline-dot ${dotClass}">${icon}</div>
        <div class="timeline-info">
          <div class="ti-title">${step.label}</div>
          <div class="ti-desc">${step.desc}</div>
        </div>
      </div>
    `;
  });

  // Handle cancelled or hold
  if (order.status === 'cancelled') {
    html += `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:var(--danger);color:white;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <div class="timeline-info">
          <div class="ti-title" style="color:var(--danger);">Cancelled</div>
          <div class="ti-desc">This order has been cancelled</div>
        </div>
      </div>
    `;
  }

  if (order.status === 'hold') {
    html += `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:var(--hold);color:white;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </div>
        <div class="timeline-info">
          <div class="ti-title" style="color:var(--hold);">On Hold</div>
          <div class="ti-desc">Additional documentation or review required</div>
        </div>
      </div>
    `;
  }

  html += '</div></div>';
  container.innerHTML = html;
  showPage('page-order-tracking');
}

// ============ RE-ORDER ============
function reorderFlow(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;

  let content = '<h3>Re-order Items</h3>';
  content += '<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Select items to add back to your cart</p>';

  order.items.forEach((item, i) => {
    content += `
      <div class="reorder-item">
        <input type="checkbox" id="reorder-${i}" checked />
        <div class="reorder-item-info">
          <div class="ri-name">${item.name}</div>
          <div class="ri-detail">${item.packSize} • Qty: ${item.qty}</div>
        </div>
      </div>
    `;
  });

  content += `<button class="btn btn-primary btn-full" style="margin-top:16px;" onclick="executeReorder('${orderId}')">Add to Cart</button>`;
  openModal(content);
}

function executeReorder(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;

  order.items.forEach((item, i) => {
    const cb = document.getElementById(`reorder-${i}`);
    if (cb && cb.checked) {
      const med = MEDICINES.find(m => m.name.includes(item.name.substring(0, 20)));
      if (med) {
        const existing = cart.find(c => c.id === med.id);
        if (existing) {
          existing.qty += item.qty;
        } else {
          cart.push({ ...med, qty: item.qty, notes: '' });
        }
      }
    }
  });

  closeModal();
  updateCartBadge();
  showToast('Items added to cart', 'success');
  setTimeout(() => { switchTab('cart'); }, 600);
}

function downloadInvoice(orderId) {
  showToast(`Invoice for ${orderId} downloaded`, 'success');
}

// ============ NOTIFICATIONS ============
function renderNotifications() {
  const container = document.getElementById('notifications-content');
  if (!container) return;

  const iconMap = {
    blue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    green: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    orange: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    purple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    red: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };

  container.innerHTML = `
    <div class="notifications-list">
      ${NOTIFICATIONS.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''} fade-in">
          <div class="notif-icon ${n.icon}">${iconMap[n.icon] || iconMap.blue}</div>
          <div class="notif-body">
            <div class="nb-title">${n.title}</div>
            <div class="nb-text">${n.text}</div>
            <div class="nb-time">${n.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============ SUPPORT ============
let supportHistoryStatus = {
  'order-support': 'open',
  'product-support': 'open'
};

function setSupportTab(tab) {
  document.querySelectorAll('.support-tabs .order-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.stab === tab);
  });
  renderSupportContent(tab);
}

function renderSupportContent(tab) {
  const container = document.getElementById('support-content');
  if (!container) return;

  if (tab === 'order-support') {
    container.innerHTML = `
      <div class="support-content" style="text-align: left;">
        <div class="support-form" style="background:white; padding:20px; border-radius:var(--radius-lg); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 16px; border-bottom: 2px solid var(--border-light); padding-bottom: 8px;">Order Support</h3>
          
          <div class="form-group">
            <label>Order No</label>
            <div class="input-wrapper">
              <input type="text" id="support-order-id" placeholder="e.g. SRX-20260522-0042" value="${latestOrderId || ''}" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Pharma Name</label>
            <div class="input-wrapper">
              <input type="text" id="support-order-pharma" placeholder="Enter pharmacy name" value="${selectedPharmacy.name}" readonly style="background:rgba(0,0,0,0.03); color:var(--text-secondary);" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Issue Type</label>
            <div class="input-wrapper">
              <select id="support-order-issue-type" style="flex: 1; border: none; background: transparent; padding: 13px 0; font-size: 14px; color: var(--text-primary); outline: none; cursor: pointer;">
                <option value="">Select Issue Type</option>
                <option value="Delayed Delivery">Delayed Delivery</option>
                <option value="Incorrect Items Delivered">Incorrect Items Delivered</option>
                <option value="Missing Items">Missing Items</option>
                <option value="Damaged in Transit">Damaged in Transit</option>
                <option value="Invoice Discrepancy">Invoice Discrepancy</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          
          <div class="form-group">
            <label>Notes (Optional)</label>
            <div class="input-wrapper textarea-wrapper">
              <textarea id="support-order-notes" placeholder="Any additional notes..." rows="2"></textarea>
            </div>
          </div>
          
          <button class="btn btn-primary btn-full" style="margin-top:16px;" onclick="submitOrderSupportRequest()">Submit Order Request</button>
        </div>

        <!-- History Section for Order Support -->
        <div class="history-section" style="margin-top: 32px; border-top: 1px solid var(--border); padding-top: 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--primary); margin:0;">Order Tickets History</h3>
            <div style="display:flex; background:var(--border-light); padding:2px; border-radius:8px;">
              <button onclick="toggleSupportHistoryStatus('order-support', 'open')" id="order-support-history-open-btn" class="support-sub-tab active" style="font-size:12px; font-weight:600; padding:4px 12px; border-radius:6px; cursor: pointer; transition:var(--transition); background:white; box-shadow:var(--shadow-sm); color:var(--primary);">Open</button>
              <button onclick="toggleSupportHistoryStatus('order-support', 'closed')" id="order-support-history-closed-btn" class="support-sub-tab" style="font-size:12px; font-weight:600; padding:4px 12px; border-radius:6px; cursor: pointer; transition:var(--transition); background:none; box-shadow:none; color:var(--text-secondary);">Closed</button>
            </div>
          </div>
          <div id="order-support-tickets-list">
            <!-- Tickets list goes here -->
          </div>
        </div>
      </div>
    `;
    renderSupportTicketsList('order-support');
  } else if (tab === 'product-support') {
    container.innerHTML = `
      <div class="support-content" style="text-align: left;">
        <div class="support-form" style="background:white; padding:20px; border-radius:var(--radius-lg); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 16px; border-bottom: 2px solid var(--border-light); padding-bottom: 8px;">Product Support</h3>
          
          
          <div class="form-group">
            <label>Product Description</label>
            <div class="input-wrapper textarea-wrapper">
              <textarea id="support-prod-desc" placeholder="Any product details........" rows="3"></textarea>
            </div>
          </div>
          
          
          
          <div class="form-group">
            <label>Response type</label>
            <div class="input-wrapper">
              <select id="support-prod-priority" style="flex: 1; border: none; background: transparent; padding: 13px 0; font-size: 14px; color: var(--text-primary); outline: none; cursor: pointer;">
                <option value="">Select Response Type</option>
                <option value="Call Back">Call Back</option>
                <option value="Email">Email</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Notes (Optional)</label>
            <div class="input-wrapper textarea-wrapper">
              <textarea id="support-prod-notes" placeholder="Any additional notes..." rows="2"></textarea>
            </div>
          </div>
          
          <button class="btn btn-primary btn-full" style="margin-top:16px;" onclick="submitProductSupportRequest()">Submit Product Request</button>
        </div>

        <!-- History Section for Product Support -->
        <div class="history-section" style="margin-top: 32px; border-top: 1px solid var(--border); padding-top: 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--primary); margin:0;">Product History</h3>
            <div style="display:flex; background:var(--border-light); padding:2px; border-radius:8px;">
              <button onclick="toggleSupportHistoryStatus('product-support', 'open')" id="product-support-history-open-btn" class="support-sub-tab active" style="font-size:12px; font-weight:600; padding:4px 12px; border-radius:6px; cursor: pointer; transition:var(--transition); background:white; box-shadow:var(--shadow-sm); color:var(--primary);">Open</button>
              <button onclick="toggleSupportHistoryStatus('product-support', 'closed')" id="product-support-history-closed-btn" class="support-sub-tab" style="font-size:12px; font-weight:600; padding:4px 12px; border-radius:6px; cursor: pointer; transition:var(--transition); background:none; box-shadow:none; color:var(--text-secondary);">Closed</button>
            </div>
          </div>
          <div id="product-support-tickets-list">
            <!-- Tickets list goes here -->
          </div>
        </div>
      </div>
    `;
    renderSupportTicketsList('product-support');
  } else if (tab === 'faq') {
    container.innerHTML = `
      <div class="support-content" style="text-align: left;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 14px; border-bottom: 2px solid var(--border-light); padding-bottom: 8px;">Frequently Asked Questions</h3>
        ${FAQS.map((faq, i) => `
          <div class="faq-item" onclick="toggleFAQ(this)" style="background:white; border-radius:var(--radius-md); border:1px solid var(--border); margin-bottom:10px; padding:12px 14px; cursor:pointer;">
            <div class="faq-question" style="display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:14px; color:var(--text-primary);">
              <span>${faq.q}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="transition:transform 0.3s;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="faq-answer" style="display:none; font-size:13px; color:var(--text-secondary); margin-top:10px; line-height:1.5; border-top:1px dashed var(--border-light); padding-top:8px;">${faq.a}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function toggleSupportHistoryStatus(tab, status) {
  supportHistoryStatus[tab] = status;

  // Toggle classes manually (active style: white background with shadow, color primary)
  const openBtn = document.getElementById(`${tab}-history-open-btn`);
  const closedBtn = document.getElementById(`${tab}-history-closed-btn`);

  if (openBtn && closedBtn) {
    if (status === 'open') {
      openBtn.style.background = 'white';
      openBtn.style.boxShadow = 'var(--shadow-sm)';
      openBtn.style.color = 'var(--primary)';
      closedBtn.style.background = 'none';
      closedBtn.style.boxShadow = 'none';
      closedBtn.style.color = 'var(--text-secondary)';
    } else {
      closedBtn.style.background = 'white';
      closedBtn.style.boxShadow = 'var(--shadow-sm)';
      closedBtn.style.color = 'var(--primary)';
      openBtn.style.background = 'none';
      openBtn.style.boxShadow = 'none';
      openBtn.style.color = 'var(--text-secondary)';
    }
  }

  renderSupportTicketsList(tab);
}

function renderSupportTicketsList(tab) {
  const listContainer = document.getElementById(`${tab}-tickets-list`);
  if (!listContainer) return;

  const status = supportHistoryStatus[tab] || 'open';
  const filtered = SUPPORT_TICKETS.filter(t => t.type === tab && t.status === status);

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state" style="padding: 24px; text-align: center; background: white; border-radius: var(--radius-md); border:1px solid var(--border);">
        <h4 style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px;">No ${status} tickets</h4>
        <p style="font-size: 11px; color: var(--text-muted); margin: 0;">Any requests submitted will be visible here.</p>
      </div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(t => createTicketCard(t)).join('');
}

function submitOrderSupportRequest() {
  const orderId = document.getElementById('support-order-id').value;
  const pharmaName = document.getElementById('support-order-pharma').value;
  const issueType = document.getElementById('support-order-issue-type').value;
  const notes = document.getElementById('support-order-notes').value;

  showLoading('Submitting request...');
  setTimeout(() => {
    hideLoading();
    const ticketId = `SR-ORD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    SUPPORT_TICKETS.unshift({
      id: ticketId,
      type: 'order-support',
      orderId: orderId,
      pharmaName: pharmaName,
      orderDate: formatDateShort(new Date()),
      orderCategory: 'open',
      issueType: issueType || 'General Inquiry',
      description: 'Order inquiry',
      priority: 'Medium',
      notes: notes,
      status: 'open',
      statusLabel: 'Under Review',
      statusClass: 'status-review',
      date: formatDate(new Date())
    });

    showToast(`Request ${ticketId} submitted successfully`, 'success');

    // Clear fields
    document.getElementById('support-order-id').value = '';
    document.getElementById('support-order-issue-type').value = '';
    document.getElementById('support-order-notes').value = '';

    renderSupportTicketsList('order-support');
  }, 1200);
}

function submitProductSupportRequest() {
  const description = document.getElementById('support-prod-desc').value;
  const priority = document.getElementById('support-prod-priority').value;
  const notes = document.getElementById('support-prod-notes').value;

  showLoading('Submitting request...');
  setTimeout(() => {
    hideLoading();
    const ticketId = `SR-PRD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    SUPPORT_TICKETS.unshift({
      id: ticketId,
      type: 'product-support',
      productName: 'General Product Inquiry',
      productCategory: 'Non-Tariff',
      issueType: 'General Inquiry',
      description: description,
      contactNo: '',
      priority: priority || 'Medium',
      notes: notes,
      status: 'open',
      statusLabel: 'Under Review',
      statusClass: 'status-review',
      date: formatDate(new Date())
    });

    showToast(`Request ${ticketId} submitted successfully`, 'success');

    // Clear fields
    document.getElementById('support-prod-desc').value = '';
    document.getElementById('support-prod-priority').value = '';
    document.getElementById('support-prod-notes').value = '';

    renderSupportTicketsList('product-support');
  }, 1200);
}

function createTicketCard(ticket) {
  if (ticket.type === 'order-support') {
    return `
      <div class="support-ticket fade-in" style="background: white; border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); margin-bottom: 12px; text-align: left;">
        <div class="ticket-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div>
            <div class="ticket-id" style="font-size:14px; font-weight:700; color:var(--primary);">${ticket.id}</div>
            <div class="ticket-category" style="font-size:12px; color:var(--text-secondary); font-weight:600; margin-top:2px;">Order No: ${ticket.orderId}</div>
          </div>
          <span class="status-pill ${ticket.statusClass}" style="font-size:11px; padding:3px 8px; border-radius:100px;">${ticket.statusLabel}</span>
        </div>
        <div style="font-size:13px; color:var(--text-secondary); display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin:10px 0; background:var(--bg); padding:10px 12px; border-radius:8px; border: 1px solid var(--border-light);">
          <div><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Pharmacy</span><strong style="color:var(--text-primary); font-size:12px;">${ticket.pharmaName}</strong></div>
          <div><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Issue Type</span><strong style="color:var(--text-primary); font-size:12px;">${ticket.issueType}</strong></div>
          ${ticket.notes ? `<div style="grid-column: span 2;"><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Notes</span><p style="margin:2px 0 0; font-size:12px; color:var(--text-secondary); font-style:italic;">${ticket.notes}</p></div>` : ''}
        </div>
        <div class="ticket-date" style="font-size:11px; color:var(--text-muted); text-align:right;">Submitted: ${ticket.date}</div>
      </div>
    `;
  } else {
    return `
      <div class="support-ticket fade-in" style="background: white; border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); margin-bottom: 12px; text-align: left;">
        <div class="ticket-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div>
            <div class="ticket-id" style="font-size:14px; font-weight:700; color:var(--primary);">${ticket.id}</div>
          </div>
          <span class="status-pill ${ticket.statusClass}" style="font-size:11px; padding:3px 8px; border-radius:100px;">${ticket.statusLabel}</span>
        </div>
        <div style="font-size:13px; color:var(--text-secondary); display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin:10px 0; background:var(--bg); padding:10px 12px; border-radius:8px; border: 1px solid var(--border-light);">
          <div style="grid-column: span 2;"><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Product Description</span><p style="margin:2px 0 0; font-size:12px; color:var(--text-primary); line-height:1.4;">${ticket.description}</p></div>
          <div style="grid-column: span 2;"><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Response Type</span><strong style="font-size:12px; color:var(--text-primary);">${ticket.priority}</strong></div>
          ${ticket.notes ? `<div style="grid-column: span 2;"><span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Notes</span><p style="margin:2px 0 0; font-size:12px; color:var(--text-secondary); font-style:italic;">${ticket.notes}</p></div>` : ''}
        </div>
        <div class="ticket-date" style="font-size:11px; color:var(--text-muted); text-align:right;">Submitted: ${ticket.date}</div>
      </div>
    `;
  }
}

function toggleFAQ(item) {
  item.classList.toggle('open');
  const ans = item.querySelector('.faq-answer');
  const icon = item.querySelector('.faq-question svg');
  if (ans && icon) {
    const open = item.classList.contains('open');
    ans.style.display = open ? 'block' : 'none';
    icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0)';
  }
}

// ============ ACCOUNT SUBPAGES ============
function showAccountSubpage(page) {
  const title = document.getElementById('subpage-title');
  const content = document.getElementById('subpage-content');

  if (page === 'profile') {
    title.textContent = 'Edit Profile';
    content.innerHTML = `
      <form class="profile-form" onsubmit="event.preventDefault();saveProfile();">
        <div class="form-group">
          <label>Full Name</label>
          <div class="input-wrapper">
            <input type="text" value="${selectedPharmacy.name}" />
          </div>
        </div>
        <div class="form-group">
          <label>Mobile Number</label>
          <div class="input-wrapper">
            <span class="input-prefix">+44</span>
            <input type="tel" value="7700 900147" />
          </div>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <div class="input-wrapper">
            <input type="email" value="admin@greencross.co.uk" />
          </div>
        </div>
        <div class="form-group">
          <label>Delivery Address</label>
          <div class="input-wrapper textarea-wrapper">
            <textarea rows="3">${selectedPharmacy.address}</textarea>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
      </form>
    `;
  } else if (page === 'address') {
    title.textContent = 'Delivery Address';
    content.innerHTML = `
      <div style="padding:4px 0;">
        <div class="cart-section" style="margin-top:0;">
          <h4>Primary Address</h4>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${selectedPharmacy.address}</p>
          <button class="btn btn-outline btn-sm" style="margin-top:12px;">Edit Address</button>
        </div>
      </div>
    `;
  } else if (page === 'prescriptions') {
    title.textContent = 'My Prescriptions';
    content.innerHTML = `
      <div style="padding:4px 0;">
        <div class="support-ticket">
          <div class="ticket-header">
            <div>
              <div class="ticket-id">RX-2026-0089</div>
              <div class="ticket-category">Liothyronine Sodium 20mcg</div>
            </div>
            <span class="status-pill status-delivered">Verified</span>
          </div>
          <div class="ticket-date">Uploaded: 22 May 2026</div>
        </div>
        <div class="support-ticket">
          <div class="ticket-header">
            <div>
              <div class="ticket-id">RX-2026-0085</div>
              <div class="ticket-category">Melatonin 2mg/5ml Solution</div>
            </div>
            <span class="status-pill status-delivered">Verified</span>
          </div>
          <div class="ticket-date">Uploaded: 20 May 2026</div>
        </div>
        <div class="support-ticket">
          <div class="ticket-header">
            <div>
              <div class="ticket-id">RX-2026-0079</div>
              <div class="ticket-category">Hydrocortisone 2.5mg MR Capsules</div>
            </div>
            <span class="status-pill status-review">Under Review</span>
          </div>
          <div class="ticket-date">Uploaded: 18 May 2026</div>
        </div>
      </div>
    `;
  } else if (page === 'change-password') {
    title.textContent = 'Change Password';
    content.innerHTML = `
      <form class="profile-form" onsubmit="event.preventDefault();changePassword();">
        <div class="form-group">
          <label>Current Password</label>
          <div class="input-wrapper">
            <input type="password" placeholder="Enter current password" />
          </div>
        </div>
        <div class="form-group">
          <label>New Password</label>
          <div class="input-wrapper">
            <input type="password" placeholder="Enter new password" />
          </div>
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <div class="input-wrapper">
            <input type="password" placeholder="Confirm new password" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Update Password</button>
      </form>
    `;
  }

  navigateTo('screen-account-subpage');
}

function saveProfile() {
  showLoading('Saving changes...');
  setTimeout(() => {
    hideLoading();
    showToast('Profile updated successfully', 'success');
  }, 1200);
}

function changePassword() {
  showLoading('Updating password...');
  setTimeout(() => {
    hideLoading();
    showToast('Password changed successfully', 'success');
  }, 1200);
}

function logout() {
  showLoading('Signing out...');
  setTimeout(() => {
    hideLoading();
    cart = [];
    rxUploaded = false;
    navigateTo('screen-login');
    showToast('Signed out successfully', 'info');
  }, 800);
}

// ============ UI HELPERS ============
function showLoading(text) {
  const el = document.getElementById('loading-overlay');
  const txt = document.getElementById('loading-text');
  if (txt) txt.textContent = text || 'Processing...';
  el.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  toast.className = `toast ${type}`;
  msgEl.textContent = message;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  iconEl.textContent = icons[type] || 'ℹ';

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.className = 'toast hidden', 400);
  }, 3000);
}

function openModal(content) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-content').innerHTML = content;
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ============ UTILITY ============
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateShort(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}
