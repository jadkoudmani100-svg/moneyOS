/**
 * Money OS - إدارة العمليات المالية والتحويلات
 */
const Transactions = (() => {
  async function createTransaction(data) {
    const amount = Number(data.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new Error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
    }

    if (!data.walletId) {
      throw new Error('يرجى اختيار المحفظة أولاً');
    }

    // التحقق من وجود المحفظة
    const rawWallets = await DB.getAllRecords('wallets');
    const targetWallet = rawWallets.find(w => w.id === data.walletId);
    if (!targetWallet) {
      throw new Error('المحفظة المختارة غير موجودة');
    }

    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      walletId: data.walletId,
      amount: amount,
      type: data.type || 'expense', // income | expense | transfer
      category: data.category || 'أخرى',
      note: (data.note || '').trim(),
      currency: targetWallet.currency || 'USD',
      date: data.date || new Date().toISOString()
    };

    await DB.putRecord('transactions', tx);
    return tx;
  }

  async function transferBetweenWallets(fromId, toId, amount) {
    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      throw new Error('يرجى إدخال مبلغ تحويل صالح');
    }

    if (fromId === toId) {
      throw new Error('لا يمكن التحويل لنفس المحفظة');
    }

    const wallets = await Wallets.getAllWallets();
    const fromW = wallets.find(w => w.id === fromId);
    const toW = wallets.find(w => w.id === toId);

    if (!fromW || !toW) {
      throw new Error('المحافظ المحددة غير متوفرة');
    }

    if (fromW.balance < amt) {
      throw new Error(`الرصيد غير كافٍ في محفظة (${fromW.name})`);
    }

    const now = new Date().toISOString();

    // 1. خصم من محفظة المصدر
    await createTransaction({
      walletId: fromId,
      amount: amt,
      type: 'expense',
      category: 'تحويل',
      note: `تحويل إلى ${toW.name}`,
      date: now
    });

    // 2. إضافة إلى محفظة الوجهة
    const convertedAmount = Rates.convert(amt, fromW.currency, toW.currency);

    await createTransaction({
      walletId: toId,
      amount: convertedAmount,
      type: 'income',
      category: 'تحويل',
      note: `تحويل من ${fromW.name}`,
      date: now
    });

    return true;
  }

  async function getAllTransactions() {
    const txs = await DB.getAllRecords('transactions');
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return {
    createTransaction,
    transferBetweenWallets,
    getAllTransactions
  };
})();
