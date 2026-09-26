/**
 * Money OS - واجهة العرض، محرك الأصوات التوليدي ومحرك الأمواج المتحركة
 */

// ==================== محرك الأصوات الفاخر (SoundFX Engine) ====================
const SoundFX = (() => {
  let audioCtx = null;
  let enabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function setEnabled(val) {
    enabled = !!val;
  }

  function isEnabled() {
    return enabled;
  }

  // 1. صوت نقر الأزرار الخفيف والممتع (Keypad Click)
  function playClick() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.045);
    } catch (e) {}
  }

  // 2. صوت فتح القفل الناجح (Harmonic Success Chime)
  function playSuccess() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + idx * 0.07);
        osc.stop(audioCtx.currentTime + idx * 0.07 + 0.3);
      });
    } catch (e) {}
  }

  // 3. صوت الخطأ للرمز PIN (Error Thud)
  function playError() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.24);
    } catch (e) {}
  }

  // 4. صوت الإيداع وإضافة المال (Cash In Chime)
  function playDeposit() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const chord = [587.33, 880, 1174.66]; // D5, A5, D6
      chord.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.05));

        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + (i * 0.05));
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i * 0.05) + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + (i * 0.05));
        osc.stop(audioCtx.currentTime + (i * 0.05) + 0.38);
      });
    } catch (e) {}
  }

  // 5. صوت المصروف أو التحويل (Smooth Swoosh)
  function playExpense() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  }

  // 6. صوت التنقل الخفيف بين التبويبات (Tab Blip)
  function playTab() {
    if (!enabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.055);
    } catch (e) {}
  }

  return {
    initAudio,
    setEnabled,
    isEnabled,
    playClick,
    playSuccess,
    playError,
    playDeposit,
    playExpense,
    playTab
  };
})();

// ==================== محرك خطوط وأمواج الخلفية المتحركة ====================
const AmbientLines = (() => {
  let canvas, ctx;
  let animId = null;
  let running = false;
  let step = 0;

  function init() {
    canvas = document.getElementById('ambientLinesCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    start();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function start() {
    if (running) return;
    running = true;
    render();
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
  }

  function render() {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    step += 0.006;

    // رسم 4 أمواج ضوئية منحنية فائقة النعومة
    drawWave(h * 0.28, 45, 0.0018, step, 'rgba(37, 99, 235, 0.16)', 'rgba(59, 130, 246, 0.04)');
    drawWave(h * 0.52, 60, 0.0012, step * 1.2 + 2, 'rgba(139, 92, 246, 0.14)', 'rgba(168, 85, 247, 0.03)');
    drawWave(h * 0.74, 50, 0.0015, step * 0.8 + 4, 'rgba(14, 165, 233, 0.12)', 'rgba(37, 99, 235, 0.02)');
    drawWave(h * 0.88, 35, 0.002, step * 1.4 + 1, 'rgba(16, 185, 129, 0.10)', 'rgba(16, 185, 129, 0.02)');

    animId = requestAnimationFrame(render);
  }

  function drawWave(baseY, amplitude, freq, offset, strokeColor, fillColor) {
    const w = canvas.width;
    ctx.beginPath();
    ctx.moveTo(0, baseY);

    for (let x = 0; x <= w; x += 15) {
      const y = baseY + Math.sin(x * freq + offset) * amplitude + Math.cos(x * freq * 0.5 + offset * 0.7) * (amplitude * 0.4);
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // ملء ضبابي أسفل المنحنى
    ctx.lineTo(w, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  return {
    init,
    start,
    stop
  };
})();

// ==================== مصير وعارض الواجهة (UIRenderer) ====================
const UIRenderer = (() => {
  let isPrivacy = false;

  function togglePrivacy() {
    isPrivacy = !isPrivacy;
    return isPrivacy;
  }

  function getPrivacy() {
    return isPrivacy;
  }

  function formatMoney(amount, currency = 'USD') {
    if (isPrivacy) return '••••';
    const num = Number(amount) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderOverview(wallets, transactions) {
    const totalWealthEl = document.getElementById('totalWealthDisplay');
    const incomeEl = document.getElementById('monthlyIncomeDisplay');
    const expenseEl = document.getElementById('monthlyExpenseDisplay');

    let totalInUsd = 0;
    wallets.forEach(w => {
      totalInUsd += Rates.convert(w.balance, w.currency, 'USD');
    });

    let totalInc = 0;
    let totalExp = 0;
    transactions.forEach(t => {
      const amtInUsd = Rates.convert(t.amount, t.currency || 'USD', 'USD');
      if (t.type === 'income') totalInc += amtInUsd;
      else if (t.type === 'expense') totalExp += amtInUsd;
    });

    if (totalWealthEl) totalWealthEl.textContent = formatMoney(totalInUsd);
    if (incomeEl) incomeEl.textContent = formatMoney(totalInc);
    if (expenseEl) expenseEl.textContent = formatMoney(totalExp);

    renderQuickWallets(wallets);
  }

  function renderQuickWallets(wallets) {
    const list = document.getElementById('quickWalletsList');
    if (!list) return;

    if (wallets.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);font-size:0.84rem;padding:8px 0;">لا توجد محافظ نشطة بعد. اضغط "+ محفظة" للبدء.</div>`;
      return;
    }

    list.innerHTML = wallets.map(w => `
      <div class="mini-wallet-card" onclick="openWalletDetail('${w.id}')">
        <div class="mini-wallet-top">
          <span class="mini-wallet-type">${w.type || 'حساب'}</span>
          <span class="mini-wallet-curr">${w.currency}</span>
        </div>
        <div class="mini-wallet-name">${w.name}</div>
        <div class="mini-wallet-balance">${formatMoney(w.balance)} <small style="font-size:0.75rem">${w.currency}</small></div>
      </div>
    `).join('');
  }

  function renderWallets(wallets) {
    const grid = document.getElementById('fullWalletsGrid');
    if (!grid) return;

    if (wallets.length === 0) {
      grid.innerHTML = `<div style="text-align:center;color:var(--text-dim);padding:30px 0;">لم يتم إنشاء أي محفظة حتى الآن.</div>`;
      return;
    }

    grid.innerHTML = wallets.map(w => `
      <div class="wallet-full-card" onclick="openWalletDetail('${w.id}')">
        <div class="wallet-full-head">
          <div class="wallet-full-title">
            <div class="wallet-avatar-icon">${(w.name || 'W').charAt(0)}</div>
            <div>
              <div class="wallet-full-name">${w.name}</div>
              <div class="wallet-full-account">${w.accountNumber || w.type}</div>
            </div>
          </div>
          <span class="currency-tag">${w.currency}</span>
        </div>
        <div class="wallet-full-balance">${formatMoney(w.balance)} ${w.currency}</div>
      </div>
    `).join('');
  }

  function renderTransactions(transactions) {
    const list = document.getElementById('homeTxList');
    const badge = document.getElementById('txCountBadge');
    if (badge) badge.textContent = transactions.length;
    if (!list) return;

    if (transactions.length === 0) {
      list.innerHTML = `<div style="text-align:center;color:var(--text-dim);padding:30px 0;">لا توجد عمليات مسجلة بعد.</div>`;
      return;
    }

    list.innerHTML = transactions.map(t => {
      const isInc = t.type === 'income';
      const sign = isInc ? '+' : '-';
      const dateStr = t.date ? new Date(t.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

      return `
        <div class="tx-item">
          <div class="tx-left">
            <div class="tx-icon-wrap ${isInc ? 'income' : 'expense'}">
              ${isInc ? '↓' : '↑'}
            </div>
            <div class="tx-details">
              <span class="tx-title">${t.note || t.category || 'معاملة'}</span>
              <span class="tx-meta">${t.category} • ${dateStr}</span>
            </div>
          </div>
          <div class="tx-amount ${isInc ? 'income' : 'expense'}">
            ${sign}${formatMoney(t.amount)} ${t.currency || ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function clearAllSensitiveDisplays() {
    const ids = ['totalWealthDisplay', 'monthlyIncomeDisplay', 'monthlyExpenseDisplay'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '••••';
    });
    const q = document.getElementById('quickWalletsList');
    if (q) q.innerHTML = '';
    const h = document.getElementById('homeTxList');
    if (h) h.innerHTML = '';
    const g = document.getElementById('fullWalletsGrid');
    if (g) g.innerHTML = '';
  }

  function showToast(msg) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast-item';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-10px)';
      t.style.transition = 'all 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  return {
    togglePrivacy,
    getPrivacy,
    formatMoney,
    renderOverview,
    renderWallets,
    renderTransactions,
    clearAllSensitiveDisplays,
    showToast
  };
})();
