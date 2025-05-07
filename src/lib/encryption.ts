/**
 * Encryption utilities for data security
 * 
 * This module provides encryption/decryption functionality for sensitive user data
 * stored in Supabase and local storage. It uses AES-256 encryption via CryptoJS.
 */

import CryptoJS from 'crypto-js';

// Prefix to identify encrypted content
const ENCRYPTION_PREFIX = 'ENCRYPTED:';

// Base encryption key - this will be combined with user-specific data
const BASE_ENCRYPTION_KEY = 'worknotes-encryption-key';

/**
 * Generate a user-specific encryption key
 * @param userId The user's ID to create a unique encryption key
 * @returns A encryption key string
 */
export const generateEncryptionKey = (userId?: string): string => {
  return userId ? `${BASE_ENCRYPTION_KEY}-${userId}` : BASE_ENCRYPTION_KEY;
};

/**
 * Encrypt data using AES-256
 * @param data Any data that can be JSON stringified
 * @param userId Optional user ID to create user-specific encryption
 * @returns Encrypted string with prefix
 */
export const encryptData = (data: any, userId?: string): string => {
  try {
    // If data is already encrypted (has our prefix), return it as is
    if (typeof data === 'string' && data.startsWith(ENCRYPTION_PREFIX)) {
      return data;
    }
    
    // Convert data to string if it's not already
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate key and encrypt
    const key = generateEncryptionKey(userId);
    const encrypted = CryptoJS.AES.encrypt(dataStr, key).toString();
    
    // Return with prefix to easily identify encrypted content
    return `${ENCRYPTION_PREFIX}${encrypted}`;
  } catch (error) {
    console.error('Error encrypting data:', error);
    // In production, we might want to handle this differently
    // For now, return stringified data as fallback
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
};

/**
 * Decrypt data that was encrypted with AES-256
 * @param data The possibly encrypted string
 * @param userId Optional user ID that was used for encryption
 * @returns Decrypted data or the original data if not encrypted/decryption fails
 */
export const decryptData = (data: any, userId?: string): any => {
  // Safety check for null or undefined input
  if (!data) {
    return data;
  }
  
  // If it's not a string or doesn't have our encryption prefix, return as is
  if (typeof data !== 'string' || !data.startsWith(ENCRYPTION_PREFIX)) {
    return data;
  }
  
  try {
    // Remove the prefix to get the actual encrypted content
    const encryptedContent = data.substring(ENCRYPTION_PREFIX.length);
    
    // Generate key and decrypt
    const key = generateEncryptionKey(userId);
    const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.warn('Decryption resulted in empty string');
      return data;
    }
    
    // Try to parse as JSON if it looks like JSON
    if (decryptedText.startsWith('{') || decryptedText.startsWith('[')) {
      try {
        return JSON.parse(decryptedText);
      } catch (e) {
        // If parsing fails, return the decrypted text as is
        return decryptedText;
      }
    }
    
    // Return the decrypted text as is
    return decryptedText;
  } catch (error) {
    console.error('Error decrypting data:', error);
    // Return the original data if decryption fails
    return data;
  }
};

/**
 * Determines if a string is encrypted with our system
 * @param data String to check
 * @returns Boolean indicating if the string is encrypted
 */
export const isEncrypted = (data: string): boolean => {
  return typeof data === 'string' && data.startsWith(ENCRYPTION_PREFIX);
};

/**
 * Add encryption flag to database record
 * @param data The data object to flag
 * @returns Object with is_encrypted flag
 */
export const flagAsEncrypted = (data: any): any => {
  return {
    ...data,
    is_encrypted: true
  };
};

/**
 * Check if a database record is flagged as encrypted
 * @param data The data object to check
 * @returns Boolean indicating if the data is flagged as encrypted
 */
export const isDataFlaggedAsEncrypted = (data: any): boolean => {
  // Check for our encryption prefix
  if (data && data.content && typeof data.content === 'string') {
    return isEncrypted(data.content);
  }
  return false;
};
