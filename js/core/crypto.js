/**
 * Money OS - تشفير AES-GCM 256 مع اشتقاق PBKDF2 وSHA-256
 */
const CryptoEngine = (() => {
  const PBKDF2_ITERATIONS = 100000;

  function generateSalt() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
  }

  async function hashPin(pin, saltBase64) {
    const enc = new TextEncoder();
    const pinData = enc.encode(pin);
    const saltData = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    const combined = new Uint8Array(pinData.length + saltData.length);
    combined.set(pinData);
    combined.set(saltData, pinData.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  async function deriveKeyFromPin(pin, saltBase64) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptData(data, key) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(JSON.stringify(data));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );

    return {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
  }

  async function decryptData(cipherObject, key) {
    const dec = new TextDecoder();
    const iv = Uint8Array.from(atob(cipherObject.iv), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(cipherObject.data), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );

    return JSON.parse(dec.decode(decrypted));
  }

  return {
    generateSalt,
    hashPin,
    deriveKeyFromPin,
    encryptData,
    decryptData
  };
})();
