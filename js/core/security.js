/**
 * Money OS - التحقق من الـ PIN، عداد المحاولات والتجميد
 */
const Security = (() => {
  const PIN_HASH = 'moneyos_pin_hash';
  const ATTEMPTS_KEY = 'moneyos_attempts';
  const LOCKOUT_KEY = 'moneyos_lockout';
  const SETTINGS_KEY = 'moneyos_settings';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { autoLock: true, haptics: true, theme: 'dark', privacyMode: false };
    } catch {
      return { autoLock: true, haptics: true, theme: 'dark', privacyMode: false };
    }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function isPinConfigured() {
    return !!localStorage.getItem(PIN_HASH);
  }

  function getRemainingAttempts() {
    const val = localStorage.getItem(ATTEMPTS_KEY);
    return val !== null ? parseInt(val, 10) : 5;
  }

  function getLockoutSeconds() {
    const until = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const diff = until - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }

  async function setPin(pin) {
    const salt = localStorage.getItem('moneyos_pin_salt') || CryptoEngine.generateSalt();
    localStorage.setItem('moneyos_pin_salt', salt);
    const hash = await CryptoEngine.hashPin(pin, salt);
    localStorage.setItem(PIN_HASH, hash);
    resetAttempts();
  }

  function removePin() {
    localStorage.removeItem(PIN_HASH);
    localStorage.removeItem('moneyos_pin_salt');
    resetAttempts();
  }

  async function verifyPin(pin) {
    const lockSec = getLockoutSeconds();
    if (lockSec > 0) return { success: false, lockedOut: true, seconds: lockSec };

    const storedHash = localStorage.getItem(PIN_HASH);
    const storedSalt = localStorage.getItem('moneyos_pin_salt');

    if (!storedHash || !storedSalt) return { success: true };

    const computed = await CryptoEngine.hashPin(pin, storedSalt);
    if (computed === storedHash) {
      resetAttempts();
      return { success: true };
    } else {
      let attempts = getRemainingAttempts() - 1;
      if (attempts <= 0) {
        localStorage.setItem(LOCKOUT_KEY, (Date.now() + 30000).toString());
        localStorage.setItem(ATTEMPTS_KEY, '0');
        return { success: false, lockedOut: true, seconds: 30 };
      } else {
        localStorage.setItem(ATTEMPTS_KEY, attempts.toString());
        return { success: false, lockedOut: false, remaining: attempts };
      }
    }
  }

  function resetAttempts() {
    localStorage.setItem(ATTEMPTS_KEY, '5');
    localStorage.removeItem(LOCKOUT_KEY);
  }

  function triggerHaptic(type = 'light') {
    const s = loadSettings();
    if (!s.haptics || !navigator.vibrate) return;
    if (type === 'error') navigator.vibrate([40, 60, 40]);
    else if (type === 'success') navigator.vibrate([30, 40]);
    else navigator.vibrate(10);
  }

  function wipeAll() {
    localStorage.clear();
  }

  return {
    loadSettings,
    saveSettings,
    isPinConfigured,
    getRemainingAttempts,
    getLockoutSeconds,
    setPin,
    removePin,
    verifyPin,
    resetAttempts,
    triggerHaptic,
    wipeAll
  };
})();
