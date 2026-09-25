/**
 * Money OS - مشغل التطبيق، إدارة النماذج، والتفاعل
 */
document.addEventListener('DOMContentLoaded', async () => {
  let enteredPin = '';
  let lockoutTimer = null;
  let currentUploadedQrBase64 = null;

  // 1. شاشة البداية
  const splash = document.getElementById('splashScreen');
  setTimeout(() => {
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 500);
    }
  }, 1200);

  // 2. الإعدادات والثيم ووضع الخصوصية
  const settings = Security.loadSettings();
  if (settings.theme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  }

  if (settings.privacyMode) {
    UIRenderer.setPrivacyMode(true);
    document.getElementById('eyeOpenIcon')?.classList.add('hidden');
    document.getElementById('eyeClosedIcon')?.classList.remove('hidden');
  }

  const themeToggle = document.getElementById('themeToggle');
  const hapticToggle = document.getElementById('hapticToggle');
  const autoLockToggle = document.getElementById('autoLockToggle');

  if (themeToggle) themeToggle.checked = settings.theme === 'dark';
  if (hapticToggle) hapticToggle.checked = !!settings.haptics;
  if (autoLockToggle) autoLockToggle.checked = !!settings.autoLock;

  // 3. القفل الأولي
  if (Security.isPinConfigured()) {
    showLockScreen();
  } else {
    await unlockWithPin('');
  }

  // ==================== دوال القفل ====================
  function showLockScreen() {
    DB.lockVault();
    UIRenderer.blankAllData();
    enteredPin = '';
    updatePinDots();

    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.remove('hidden');

    checkLockout();
  }

  function hideLockScreen() {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    enteredPin = '';
    updatePinDots();
  }

  function checkLockout() {
    const sec = Security.getLockoutSeconds();
    const box = document.getElementById('lockAttemptsBox');
    const txt = document.getElementById('lockAttemptsText');

    if (sec > 0) {
      if (box) box.classList.remove('hidden');
      if (txt) txt.textContent = `الخزينة مجمدة مؤقتاً. انتظر ${sec} ثانية...`;
      disableNumpad(true);

      if (!lockoutTimer) {
        lockoutTimer = setInterval(() => {
          const rem = Security.getLockoutSeconds();
          if (rem <= 0) {
            clearInterval(lockoutTimer);
            lockoutTimer = null;
            disableNumpad(false);
            if (box) box.classList.add('hidden');
          } else {
            if (txt) txt.textContent = `الخزينة مجمدة مؤقتاً. انتظر ${rem} ثانية...`;
          }
        }, 1000);
      }
    } else {
      const rem = Security.getRemainingAttempts();
      if (rem < 5) {
        if (box) box.classList.remove('hidden');
        if (txt) txt.textContent = `تنبيه: متبقي ${rem} محاولات فقط!`;
      } else {
        if (box) box.classList.add('hidden');
      }
      disableNumpad(false);
    }
  }

  function disableNumpad(val) {
    document.querySelectorAll('.num-btn').forEach(b => b.disabled = val);
  }

  function updatePinDots() {
    document.querySelectorAll('#pinDots .dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < enteredPin.length);
    });
  }

  // أزرار الكيباد
  const numpad = document.getElementById('numpadGrid');
  if (numpad) {
    numpad.addEventListener('click', async (e) => {
      const btn = e.target.closest('.num-btn');
      if (!btn || btn.disabled) return;

      Security.triggerHaptic('light');
      const val = btn.dataset.val;

      if (val !== undefined) {
        if (enteredPin.length < 4) {
          enteredPin += val;
          updatePinDots();

          if (enteredPin.length === 4) {
            await handlePinSubmit(enteredPin);
          }
        }
      }
    });
  }

  const deleteBtn = document.getElementById('deletePinBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (enteredPin.length > 0) {
        Security.triggerHaptic('light');
        enteredPin = enteredPin.slice(0, -1);
        updatePinDots();
      }
    });
  }

  async function handlePinSubmit(pin) {
    const res = await Security.verifyPin(pin);
    if (res.success) {
      Security.triggerHaptic('success');
      await unlockWithPin(pin);
      hideLockScreen();
    } else {
      Security.triggerHaptic('error');
      const dots = document.getElementById('pinDots');
      if (dots) {
        dots.classList.add('shake');
        setTimeout(() => dots.classList.remove('shake'), 400);
      }
      enteredPin = '';
      updatePinDots();
      checkLockout();
    }
  }

  async function unlockWithPin(pin) {
    try {
      await DB.initDB(pin);
      await refreshUI();
    } catch (err) {
      console.error(err);
      UIRenderer.showToast('خطأ في فك تشفير البيانات');
    }
  }

  // ==================== تحديث الواجهة ====================
  async function refreshUI() {
    const wallets = await Wallets.getAllWallets();
    const transactions = await Transactions.getAllTransactions();

    populateSelects(wallets);

    let totalUSD = 0, incomeUSD = 0, expenseUSD = 0;
    wallets.forEach(w => totalUSD += Rates.convertToUSD(w.balance, w.currency));
    transactions.forEach(t => {
      const val = Rates.convertToUSD(t.amount, t.currency);
      if (t.type === 'income') incomeUSD += val;
      if (t.type === 'expense') expenseUSD += val;
    });

    UIRenderer.renderNetWorth(totalUSD, incomeUSD, expenseUSD);
    UIRenderer.renderWallets(wallets);
    UIRenderer.renderTransactions(transactions.slice(0, 5), 'homeRecentTxList');
    UIRenderer.renderTransactions(transactions, 'fullTxList');

    const badge = document.getElementById('txCountBadge');
    if (badge) badge.textContent = transactions.length.toString();

    Analytics.drawChart(transactions);
    bindWalletCardClicks();
  }

  function populateSelects(wallets) {
    const selects = [
      document.getElementById('txWalletField'),
      document.getElementById('tfFromWalletField'),
      document.getElementById('tfToWalletField')
    ];
    selects.forEach(s => {
      if (!s) return;
      if (wallets.length === 0) {
        s.innerHTML = '<option value="">-- يرجى إنشاء محفظة أولاً --</option>';
      } else {
        s.innerHTML = wallets.map(w => `<option value="${w.id}">${w.name} (${w.currency})</option>`).join('');
      }
    });
  }

  // فتح تفاصيل المحفظة والـ QR عند الضغط على الكارت
  function bindWalletCardClicks() {
    document.querySelectorAll('.wallet-chip-card').forEach(card => {
      card.addEventListener('click', async () => {
        const wid = card.dataset.wid;
        const w = await Wallets.getWalletById(wid);
        if (!w) return;

        document.getElementById('wDetailName').textContent = w.name;
        document.getElementById('wDetailBalance').textContent = `${UIRenderer.formatMoney(w.balance, w.currency)} ${w.currency}`;
        document.getElementById('wDetailCurrency').textContent = w.currency;

        const accEl = document.getElementById('wDetailAccount');
        const accRow = document.getElementById('wDetailAccountRow');
        if (w.accountNo) {
          accEl.textContent = w.accountNo;
          accRow.classList.remove('hidden');
        } else {
          accRow.classList.add('hidden');
        }

        const qrBox = document.getElementById('wDetailQrBox');
        const qrImg = document.getElementById('wDetailQrImg');
        if (w.qrCode) {
          qrImg.src = w.qrCode;
          qrBox.classList.remove('hidden');
        } else {
          qrBox.classList.add('hidden');
        }

        document.getElementById('walletDetailsModal').classList.remove('hidden');
      });
    });
  }

  // ==================== رفع صورة الـ QR للمحفظة ====================
  const qrInput = document.getElementById('walletQrFileField');
  const qrBox = document.getElementById('qrPreviewBox');
  const qrImg = document.getElementById('qrPreviewImg');
  const rmQrBtn = document.getElementById('removeQrBtn');

  if (qrInput) {
    qrInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          currentUploadedQrBase64 = re.target.result;
          qrImg.src = currentUploadedQrBase64;
          qrBox.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (rmQrBtn) {
    rmQrBtn.addEventListener('click', () => {
      currentUploadedQrBase64 = null;
      qrInput.value = '';
      qrBox.classList.add('hidden');
    });
  }

  // ==================== إرسال النماذج بدون تعليق ====================

  // 1. نموذج العملية (إيداع / سحب)
  const txForm = document.getElementById('txForm');
  const txSubmitBtn = document.getElementById('txSubmitBtn');

  if (txForm) {
    txForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amountVal = document.getElementById('txAmountField').value;
      const walletId = document.getElementById('txWalletField').value;
      const type = document.getElementById('txTypeField').value;
      const category = document.getElementById('txCategoryField').value;
      const note = document.getElementById('txNoteField').value;

      if (!walletId) {
        alert('يرجى إنشاء محفظة أولاً قبل تسجيل أي عملية');
        return;
      }

      try {
        txSubmitBtn.disabled = true;
        txSubmitBtn.textContent = 'جاري الحفظ المشفر...';

        await Transactions.createTransaction({
          amount: parseFloat(amountVal),
          walletId: walletId,
          type: type,
          category: category,
          note: note,
          date: new Date().toISOString()
        });

        document.getElementById('txModal').classList.add('hidden');
        txForm.reset();
        UIRenderer.showToast(type === 'income' ? 'تم تسجيل الإيداع بنجاح' : 'تم تسجيل المصروف');
        await refreshUI();
      } catch (err) {
        alert('خطأ: ' + err.message);
      } finally {
        txSubmitBtn.disabled = false;
        txSubmitBtn.textContent = 'حفظ العملية المشفرة';
      }
    });
  }

  // 2. نموذج إنشاء محفظة متطورة
  const walletForm = document.getElementById('walletForm');
  const walletSubmitBtn = document.getElementById('walletSubmitBtn');

  if (walletForm) {
    walletForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('walletNameField').value;
      const type = document.getElementById('walletTypeField').value;
      const accountNo = document.getElementById('walletAccountNoField').value;
      const currency = document.getElementById('walletCurrencyField').value;
      const initBal = parseFloat(document.getElementById('walletInitialBalanceField').value) || 0;

      try {
        walletSubmitBtn.disabled = true;
        walletSubmitBtn.textContent = 'جاري التشفير والحفظ...';

        await Wallets.createWallet({
          name: name,
          type: type,
          accountNo: accountNo,
          currency: currency,
          initialBalance: initBal,
          qrCode: currentUploadedQrBase64
        });

        document.getElementById('walletModal').classList.add('hidden');
        walletForm.reset();
        currentUploadedQrBase64 = null;
        if (qrBox) qrBox.classList.add('hidden');

        UIRenderer.showToast('تم إنشاء وتشفير المحفظة');
        await refreshUI();
      } catch (err) {
        alert('خطأ: ' + err.message);
      } finally {
        walletSubmitBtn.disabled = false;
        walletSubmitBtn.textContent = 'إنشاء وتشفير المحفظة';
      }
    });
  }

  // 3. نموذج التحويل
  const transferForm = document.getElementById('transferForm');
  const transferSubmitBtn = document.getElementById('transferSubmitBtn');

  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const from = document.getElementById('tfFromWalletField').value;
      const to = document.getElementById('tfToWalletField').value;
      const amt = parseFloat(document.getElementById('tfAmountField').value);

      try {
        transferSubmitBtn.disabled = true;
        transferSubmitBtn.textContent = 'جاري إتمام التحويل...';

        await Transactions.transferBetweenWallets(from, to, amt);
        document.getElementById('transferModal').classList.add('hidden');
        transferForm.reset();
        UIRenderer.showToast('تم التحويل بنجاح');
        await refreshUI();
      } catch (err) {
        alert(err.message);
      } finally {
        transferSubmitBtn.disabled = false;
        transferSubmitBtn.textContent = 'إتمام التحويل';
      }
    });
  }

  // ==================== زر إخفاء الرصيد (Privacy Mode) ====================
  const privacyBtn = document.getElementById('togglePrivacyBtn');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      Security.triggerHaptic('light');
      const isPriv = !UIRenderer.getPrivacyMode();
      UIRenderer.setPrivacyMode(isPriv);
      settings.privacyMode = isPriv;
      Security.saveSettings(settings);

      document.getElementById('eyeOpenIcon').classList.toggle('hidden', isPriv);
      document.getElementById('eyeClosedIcon').classList.toggle('hidden', !isPriv);
      refreshUI();
    });
  }

  // ==================== التنقل والنوافذ ====================
  document.querySelectorAll('.dock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Security.triggerHaptic('light');
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetView = btn.dataset.view;
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      const activeP = document.getElementById(targetView);
      if (activeP) activeP.classList.add('active');

      const titles = {
        viewHome: 'لوحة التحكم',
        viewWallets: 'المحافظ والعمليات',
        viewAnalytics: 'التحليلات والمصروفات',
        viewSettings: 'الإعدادات والأمان'
      };
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = titles[targetView] || 'Money OS';

      if (targetView === 'viewAnalytics') {
        Transactions.getAllTransactions().then(txs => Analytics.drawChart(txs));
      }
    });
  });

  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => {
      const m = document.getElementById(b.dataset.close);
      if (m) m.classList.add('hidden');
    });
  });

  document.getElementById('openDepositModalBtn')?.addEventListener('click', () => {
    document.getElementById('txTypeField').value = 'income';
    document.getElementById('txModalTitle').textContent = 'إيداع جديد';
    document.getElementById('txModal').classList.remove('hidden');
  });

  document.getElementById('openExpenseModalBtn')?.addEventListener('click', () => {
    document.getElementById('txTypeField').value = 'expense';
    document.getElementById('txModalTitle').textContent = 'سحب جديد';
    document.getElementById('txModal').classList.remove('hidden');
  });

  document.getElementById('openTransferModalBtn')?.addEventListener('click', () => {
    document.getElementById('transferModal').classList.remove('hidden');
  });

  const openWalletModal = () => document.getElementById('walletModal').classList.remove('hidden');
  document.getElementById('createNewWalletBtn')?.addEventListener('click', openWalletModal);
  document.getElementById('addNewWalletShortcut')?.addEventListener('click', openWalletModal);

  document.getElementById('quickLockBtn')?.addEventListener('click', () => {
    Security.triggerHaptic('light');
    showLockScreen();
  });

  // تصفية وبحث
  document.getElementById('txSearchInput')?.addEventListener('input', async (e) => {
    const q = e.target.value.toLowerCase();
    const all = await Transactions.getAllTransactions();
    const filtered = all.filter(t => (t.note || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
    UIRenderer.renderTransactions(filtered, 'fullTxList');
  });

  document.querySelectorAll('.filter-pills-row .pill').forEach(pill => {
    pill.addEventListener('click', async () => {
      document.querySelectorAll('.filter-pills-row .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter;
      const all = await Transactions.getAllTransactions();
      const res = filter === 'all' ? all : all.filter(t => t.type === filter);
      UIRenderer.renderTransactions(res, 'fullTxList');
    });
  });

  // إعدادات الـ PIN
  document.getElementById('managePinBtn')?.addEventListener('click', () => {
    const configured = Security.isPinConfigured();
    document.getElementById('removePinBtn').classList.toggle('hidden', !configured);
    document.getElementById('setupPinModal').classList.remove('hidden');
  });

  document.getElementById('setupPinForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('newPinInput').value;
    const p2 = document.getElementById('confirmPinInput').value;

    if (p1 !== p2) {
      alert('الرمزان غير متطابقين!');
      return;
    }

    try {
      await DB.reencryptDatabaseWithPin(p1);
      await Security.setPin(p1);
      document.getElementById('setupPinModal').classList.add('hidden');
      e.target.reset();
      UIRenderer.showToast('تم تعيين رمز PIN وتشفير الخزينة');
      updateSecCard();
    } catch (err) {
      alert('فشل تفعيل الرمز: ' + err.message);
    }
  });

  document.getElementById('removePinBtn')?.addEventListener('click', async () => {
    if (confirm('هل تريد إلغاء رمز PIN وفك تشفير الخزينة؟')) {
      await DB.reencryptDatabaseWithPin('');
      Security.removePin();
      document.getElementById('setupPinModal').classList.add('hidden');
      UIRenderer.showToast('تم إلغاء رمز PIN');
      updateSecCard();
    }
  });

  function updateSecCard() {
    const isPin = Security.isPinConfigured();
    const t = document.getElementById('secStatusTitle');
    const d = document.getElementById('secStatusDesc');
    const s = document.getElementById('pinSettingSub');

    if (isPin) {
      if (t) t.textContent = 'Money OS مؤمن برمز PIN';
      if (d) d.textContent = 'مشفر بخوارزمية AES-256 مع PBKDF2.';
      if (s) s.textContent = 'مفعل (اضغط للتغيير أو الإلغاء)';
    } else {
      if (t) t.textContent = 'الحماية برمز PIN معطلة';
      if (d) d.textContent = 'مشفر بمفتاح الجهاز الافتراضي.';
      if (s) s.textContent = 'غير مفعل (اضغط للإعداد)';
    }
  }
  updateSecCard();

  // تصفير الخزينة
  const wipeFn = async () => {
    if (confirm('تحذير نهائي: مسح شامل لقاعدة البيانات والمحافظ نهائياً؟')) {
      await DB.wipeEntireDatabase();
      Security.wipeAll();
      location.reload();
    }
  };
  document.getElementById('emergencyResetBtn')?.addEventListener('click', wipeFn);
  document.getElementById('wipeAllDataBtn')?.addEventListener('click', wipeFn);

  // التبديلات
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      settings.theme = themeToggle.checked ? 'dark' : 'light';
      Security.saveSettings(settings);
      document.body.classList.toggle('theme-dark', settings.theme === 'dark');
      document.body.classList.toggle('theme-light', settings.theme === 'light');
    });
  }

  if (hapticToggle) {
    hapticToggle.addEventListener('change', () => {
      settings.haptics = hapticToggle.checked;
      Security.saveSettings(settings);
    });
  }

  if (autoLockToggle) {
    autoLockToggle.addEventListener('change', () => {
      settings.autoLock = autoLockToggle.checked;
      Security.saveSettings(settings);
    });
  }
});
