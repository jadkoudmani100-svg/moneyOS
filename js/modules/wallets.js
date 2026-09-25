/**
 * Money OS - إدارة المحافظ بدون احتساب مضاعف للرصيد
 */
const Wallets = (() => {
  async function createWallet(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('يرجى إدخال اسم المحفظة');
    }

    const initBal = Number(data.initialBalance) || 0;

    const wallet = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: data.name.trim(),
      currency: data.currency || 'USD',
      type: data.type || 'bank',
      accountNo: (data.accountNo || '').trim(),
      qrCode: data.qrCode || null, // Base64 image
      initialBalance: initBal,
      createdAt: new Date().toISOString()
    };

    // حفظ المحفظة مشفرة
    await DB.putRecord('wallets', wallet);

    // إذا وُجد رصيد افتتاحي أكبر من 0، ننشئ له معاملة إيداع فقط
    // ولا يتم جمعه مرتين لأن دالة الحساب تعتمد فقط على سجل المعاملات
    if (initBal > 0) {
      await Transactions.createTransaction({
        amount: initBal,
        walletId: wallet.id,
        type: 'income',
        category: 'راتب',
        note: 'رصيد افتتاحي للمحفظة',
        date: wallet.createdAt
      });
    }

    return wallet;
  }

  async function getAllWallets() {
    const rawWallets = await DB.getAllRecords('wallets');
    const allTx = await DB.getAllRecords('transactions');

    // حساب الرصيد الفعلي بدقة: المعاملات وحدها تقود الرصيد لتجنب الإضافة المزدوجة
    return rawWallets.map(w => {
      let balance = 0;
      
      const relatedTx = allTx.filter(t => t.walletId === w.id);
      if (relatedTx.length === 0) {
        balance = Number(w.initialBalance) || 0;
      } else {
        relatedTx.forEach(t => {
          const amt = Number(t.amount) || 0;
          if (t.type === 'income') balance += amt;
          else if (t.type === 'expense') balance -= amt;
        });
      }

      return {
        ...w,
        balance: balance
      };
    });
  }

  async function getWalletById(id) {
    const wallets = await getAllWallets();
    return wallets.find(w => w.id === id) || null;
  }

  return {
    createWallet,
    getAllWallets,
    getWalletById
  };
})();
