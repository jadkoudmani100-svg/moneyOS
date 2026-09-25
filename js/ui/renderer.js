/**
 * Money OS - واجهة العرض والتنسيق وإخفاء الرصيد السلس
 */
const UIRenderer = (() => {
  let isPrivacy = false;

  function setPrivacyMode(val) {
    isPrivacy = !!val;
  }

  function getPrivacyMode() {
    return isPrivacy;
  }

  function formatMoney(amount, currency = 'USD') {
    if (isPrivacy) return '••••';
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  function blankAllData() {
    const netEl = document.getElementById('netWorthValue');
    const incEl = document.getElementById('totalIncomeValue');
    const expEl = document.getElementById('totalExpenseValue');
    if (netEl) netEl.textContent = '••••';
    if (incEl) incEl.textContent = '••••';
    if (expEl) expEl.textContent = '••••';

    const homeWallets = document.getElementById('homeWalletsScroll');
    const allWallets = document.getElementById('allWalletsGrid');
    const homeTx = document.getElementById('homeRecentTxList');
    const fullTx = document.getElementById('fullTxList');

    if (homeWallets) homeWallets.innerHTML = '';
    if (allWallets) allWallets.innerHTML = '';
    if (homeTx) homeTx.innerHTML = '';
    if (fullTx) fullTx.innerHTML = '';
  }

  function renderNetWorth(total, income, expense) {
    const netEl = document.getElementById('netWorthValue');
    const incEl = document.getElementById('totalIncomeValue');
    const expEl = document.getElementById('totalExpenseValue');

    if (netEl) netEl.textContent = formatMoney(total, 'USD');
    if (incEl) incEl.textContent = isPrivacy ? '••••' : `$${formatMoney(income, 'USD')}`;
    if (expEl) expEl.textContent = isPrivacy ? '••••' : `$${formatMoney(expense, 'USD')}`;
  }

  function renderWallets(wallets = []) {
    const homeTrack = document.getElementById('homeWalletsScroll');
    const grid = document.getElementById('allWalletsGrid');

    if (!wallets || wallets.length === 0) {
      const emptyHtml = `
        <div class="empty-state" style="width: 100%;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          <p>لا توجد محافظ بعد. اضغط "+ محفظة جديدة" للبدء.</p>
        </div>
      `;
      if (homeTrack) homeTrack.innerHTML = emptyHtml;
      if (grid) grid.innerHTML = emptyHtml;
      return;
    }

    const typeLabels = {
      bank: 'بنكي',
      cash: 'كاش',
      crypto: 'كريبتو',
      savings: 'ادخار'
    };

    const cardsHtml = wallets.map(w => `
      <div class="wallet-chip-card" data-wid="${w.id}">
        <div class="wallet-header-mini">
          <span class="w-title">${escapeHtml(w.name)}</span>
          <span class="w-type-badge">${typeLabels[w.type] || 'عام'}</span>
        </div>
        <span class="w-val">${formatMoney(w.balance, w.currency)}</span>
        <span class="w-cur">${w.currency} ${w.qrCode ? '• [QR]' : ''}</span>
      </div>
    `).join('');

    if (homeTrack) homeTrack.innerHTML = cardsHtml;
    if (grid) grid.innerHTML = cardsHtml;
  }

  function renderTransactions(transactions = [], containerId = 'homeRecentTxList') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>لا توجد عمليات مسجلة بعد.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions.map(t => {
      const isInc = t.type === 'income';
      const isExp = t.type === 'expense';
      const sign = isInc ? '+' : isExp ? '-' : '⇄';
      const dateStr = t.date ? new Date(t.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '';

      return `
        <div class="tx-row ${t.type}">
          <div class="tx-lead">
            <div class="tx-badge-icon">
              ${isInc ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>' : 
                isExp ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline></svg>' : 
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"></polyline><polyline points="7 23 3 19 7 15"></polyline></svg>'}
            </div>
            <div class="tx-details">
              <span class="tx-category">${escapeHtml(t.category || (t.type === 'transfer' ? 'تحويل' : 'عملية'))}</span>
              <span class="tx-meta">${escapeHtml(t.note || '')} ${dateStr ? '• ' + dateStr : ''}</span>
            </div>
          </div>
          <div class="tx-amount-box">
            <span class="tx-val">${sign} ${formatMoney(t.amount, t.currency)}</span>
            <span class="tx-meta">${t.currency || ''}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const el = document.getElementById('toastNotification');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 2800);
  }

  return {
    setPrivacyMode,
    getPrivacyMode,
    formatMoney,
    blankAllData,
    renderNetWorth,
    renderWallets,
    renderTransactions,
    showToast
  };
})();
