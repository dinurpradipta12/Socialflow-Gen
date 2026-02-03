import crypto from 'crypto';

const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // recommended for GCM

function getKey(): Buffer {
  const k = process.env.ENCRYPTION_KEY || '';
  if (!k || Buffer.from(k, 'utf8').length < KEY_LEN) {
    throw new Error('ENCRYPTION_KEY must be set and 32 bytes');
  }
  return Buffer.from(k, 'utf8').slice(0, KEY_LEN);
}

export function encryptText(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

export function decryptText(encryptedText: string): string {
  const key = getKey();
  const [ivHex, cipherHex, tagHex] = encryptedText.split(':');
  if (!ivHex || !cipherHex || !tagHex) throw new Error('invalid encrypted payload');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(cipherHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
