/**
 * Money OS - قاعدة البيانات المشفرة IndexedDB مع ترحيل وإعادة التشفير
 */
const DB = (() => {
  const DB_NAME = 'MoneyOS_Vault_v1';
  const DB_VERSION = 1;
  let dbInstance = null;
  let activeVaultKey = null;

  async function getDeviceFallbackKey() {
    let keyRaw = localStorage.getItem('moneyos_device_key');
    if (!keyRaw) {
      const randomKey = crypto.getRandomValues(new Uint8Array(32));
      keyRaw = btoa(String.fromCharCode(...randomKey));
      localStorage.setItem('moneyos_device_key', keyRaw);
    }
    const rawBytes = Uint8Array.from(atob(keyRaw), c => c.charCodeAt(0));
    return await crypto.subtle.importKey('raw', rawBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  async function initDB(pin = '') {
    return new Promise(async (resolve, reject) => {
      try {
        if (pin && Security.isPinConfigured()) {
          const salt = localStorage.getItem('moneyos_pin_salt');
          activeVaultKey = await CryptoEngine.deriveKeyFromPin(pin, salt);
        } else {
          activeVaultKey = await getDeviceFallbackKey();
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('wallets')) {
            db.createObjectStore('wallets', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
        };

        request.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };

        request.onerror = (e) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  function lockVault() {
    activeVaultKey = null; // مسح المفتاح فوراً من الذاكرة
  }

  async function putRecord(storeName, record) {
    if (!activeVaultKey) throw new Error('الخزينة مقفلة! لا يمكن التعديل.');
    const encrypted = await CryptoEngine.encryptData(record, activeVaultKey);
    const envelope = { id: record.id, payload: encrypted };

    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(envelope);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAllRecords(storeName) {
    if (!activeVaultKey) return [];
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = async () => {
        try {
          const list = req.result || [];
          const decrypted = [];
          for (const item of list) {
            if (item.payload) {
              const rec = await CryptoEngine.decryptData(item.payload, activeVaultKey);
              decrypted.push(rec);
            }
          }
          resolve(decrypted);
        } catch (e) {
          reject(e);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function reencryptDatabaseWithPin(newPin) {
    const currentWallets = await getAllRecords('wallets');
    const currentTx = await getAllRecords('transactions');

    let newKey;
    if (newPin) {
      const newSalt = CryptoEngine.generateSalt();
      localStorage.setItem('moneyos_pin_salt', newSalt);
      newKey = await CryptoEngine.deriveKeyFromPin(newPin, newSalt);
    } else {
      localStorage.removeItem('moneyos_pin_salt');
      newKey = await getDeviceFallbackKey();
    }

    activeVaultKey = newKey;

    for (const w of currentWallets) await putRecord('wallets', w);
    for (const t of currentTx) await putRecord('transactions', t);
  }

  async function wipeEntireDatabase() {
    if (dbInstance) dbInstance.close();
    return new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(true);
    });
  }

  return {
    initDB,
    lockVault,
    putRecord,
    getAllRecords,
    reencryptDatabaseWithPin,
    wipeEntireDatabase
  };
})();
