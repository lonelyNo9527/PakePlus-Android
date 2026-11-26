/* ═══════════════════════════════════════════════════════════
 * 加解密 —— 复刻 crypto-js AES.encrypt(plain, passphrase)
 * 格式: base64("Salted__" + salt8 + AES-256-CBC/PKCS7)
 * KDF : EVP_BytesToKey (MD5, 1 次迭代) → key32 + iv16
 * ═══════════════════════════════════════════════════════════ */
const SAVE_SECRET = 'yunyin-xiuxian::dao-in-the-clouds::v1';
const SAVE_PREFIX = 'yunyin.';
const STORE_IDS = ['game','player','resources','inventory','cultivation','dongfu','adventure','quests','settings','loadouts','endgame','lore'];

/* ---------- MD5 (RFC 1321) ---------- */
function md5(u8) {
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  const len = u8.length;
  const total = (((len + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(total);
  buf.set(u8); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (len * 8) >>> 0, true);
  dv.setUint32(total - 4, Math.floor(len * 8 / 4294967296), true);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const rol = (x, n) => (x << n) | (x >>> (32 - n));
  for (let off = 0; off < total; off += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    let A = a, B = b, C = c, D = d;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16)      { f = (B & C) | (~B & D); g = i; }
      else if (i < 32) { f = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = B ^ C ^ D;          g = (3 * i + 5) % 16; }
      else             { f = C ^ (B | ~D);       g = (7 * i) % 16; }
      const tmp = D; D = C; C = B;
      B = (B + rol((A + f + K[i] + M[g]) >>> 0, S[i])) >>> 0;
      A = tmp;
    }
    a = (a + A) >>> 0; b = (b + B) >>> 0; c = (c + C) >>> 0; d = (d + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a, true); odv.setUint32(4, b, true);
  odv.setUint32(8, c, true); odv.setUint32(12, d, true);
  return out;
}
const encUtf8 = s => new TextEncoder().encode(s);
const decUtf8 = u8 => new TextDecoder('utf-8', { fatal: false }).decode(u8);
function b64encode(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192));
  return btoa(s);
}
function b64decode(s) { const bin = atob(s); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
const concat = (...arrs) => { const n = arrs.reduce((s, a) => s + a.length, 0); const out = new Uint8Array(n); let p = 0; for (const a of arrs) { out.set(a, p); p += a.length; } return out; };

function evpKDF(password, salt) {
  const keyLen = 32, ivLen = 16, out = [];
  let prev = new Uint8Array(0);
  while (out.length < keyLen + ivLen) {
    prev = md5(concat(prev, password, salt));
    out.push(...prev);
  }
  return { key: new Uint8Array(out.slice(0, keyLen)), iv: new Uint8Array(out.slice(keyLen, keyLen + ivLen)) };
}

async function aesEncrypt(plainText, passphrase = SAVE_SECRET) {
  const salt = crypto.getRandomValues(new Uint8Array(8));
  const { key, iv } = evpKDF(encUtf8(passphrase), salt);
  const k = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, k, encUtf8(plainText)));
  return b64encode(concat(encUtf8('Salted__'), salt, ct));
}

async function aesDecrypt(cipherText, passphrase = SAVE_SECRET) {
  let raw;
  try { raw = b64decode(cipherText.trim()); } catch { return null; }
  if (raw.length < 32) return null;
  if (decUtf8(raw.slice(0, 8)) !== 'Salted__') return null;
  const salt = raw.slice(8, 16), ct = raw.slice(16);
  const { key, iv } = evpKDF(encUtf8(passphrase), salt);
  const k = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['decrypt']);
  try {
    const text = decUtf8(new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, k, ct)));
    return text.length > 0 ? text : null;
  } catch { return null; }
}

const readSaveText = async raw => (await aesDecrypt(raw)) ?? raw;

