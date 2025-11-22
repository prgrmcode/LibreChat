import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param data - Plain text data to encrypt
 * @param encryptionKey - Encryption key from environment variable
 * @returns Encrypted string in format: salt:iv:tag:ciphertext
 */
export const encrypt = (data: string, encryptionKey: string): string => {
  if (!data) return data;
  
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(encryptionKey, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: salt:iv:tag:ciphertext
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data encrypted with encrypt()
 * @param ciphertext - Encrypted string in format: salt:iv:tag:ciphertext
 * @param encryptionKey - Encryption key from environment variable
 * @returns Decrypted plain text
 */
export const decrypt = (ciphertext: string, encryptionKey: string): string => {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
  
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      return ciphertext; // Not encrypted, return as-is
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    
    const key = deriveKey(encryptionKey, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return ciphertext; // Return original if decryption fails
  }
};

/**
 * Checks if data is encrypted
 */
export const isEncrypted = (data: string): boolean => {
  if (!data || typeof data !== 'string') return false;
  const parts = data.split(':');
  return parts.length === 4 && parts.every(part => /^[0-9a-f]+$/.test(part));
};