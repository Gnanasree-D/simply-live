/**
 * Client-side E2EE primitives via the Web Crypto API.
 *
 * The user's password (or recovery key) is fed through PBKDF2 to derive a
 * 256-bit AES-GCM key. That key never leaves the device — the server only
 * sees the salts and the resulting ciphertext.
 *
 * Encrypted payloads are serialised as base64 of `iv || ciphertext`, where
 * `iv` is exactly 12 bytes.
 */

const PBKDF2_ITERATIONS = 600_000;
const AES_KEY_BITS = 256;
const IV_BYTES = 12;

function bytesToB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveKey(
  password: string,
  saltB64: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_BITS },
    /* extractable */ true,
    ["encrypt", "decrypt"],
  );
}

/** Serialize a derived key for persistence in localStorage. */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToB64(raw);
}

export async function importKey(rawB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    b64ToBytes(rawB64),
    { name: "AES-GCM", length: AES_KEY_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson<T>(value: T, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const payload = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    payload,
  );
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return bytesToB64(out);
}

export async function decryptJson<T>(
  blob: string,
  key: CryptoKey,
): Promise<T> {
  const bytes = b64ToBytes(blob);
  if (bytes.length < IV_BYTES + 1) throw new Error("Ciphertext too short");
  const iv = bytes.slice(0, IV_BYTES);
  const cipher = bytes.slice(IV_BYTES);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
