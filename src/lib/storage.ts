
import { Task, TasksByDate } from './types';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'smart-todo-tasks';
const ENCRYPTION_KEY = 'smart-todo-encryption-key'; // Default key if no user-specific key

// Helper function to get the encryption key (can be user-specific)
const getEncryptionKey = (userId?: string): string => {
  return userId ? `${ENCRYPTION_KEY}-${userId}` : ENCRYPTION_KEY;
};

// Helper function to check if a string is likely encrypted
const isLikelyEncrypted = (str: string): boolean => {
  // Encrypted data is typically a long string with specific characters
  // This is a simple heuristic - real encrypted data with AES is base64-encoded
  return str.length > 20 && /^[A-Za-z0-9+/=]+$/.test(str);
};

// Encrypt data
export const encrypt = (data: any, userId?: string): string => {
  try {
    const key = getEncryptionKey(userId);
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  } catch (error) {
    console.error('Error encrypting data:', error);
    return JSON.stringify(data); // Fallback to unencrypted as last resort
  }
};

// Decrypt data
export const decrypt = (encryptedData: string, userId?: string): any => {
  // If the data doesn't look encrypted, try parsing it directly
  if (!isLikelyEncrypted(encryptedData)) {
    try {
      return JSON.parse(encryptedData);
    } catch (e) {
      console.error('Error parsing non-encrypted data:', e);
      return encryptedData; // Return as-is if it can't be parsed
    }
  }

  // Try to decrypt the data
  try {
    const key = getEncryptionKey(userId);
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Check if the decrypted text is valid before parsing
    if (!decryptedText) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return JSON.parse(decryptedText);
  } catch (error) {
    console.warn('Decryption failed, trying to parse as plain JSON:', error);
    
    // If decryption fails, try parsing as plain JSON
    try {
      return JSON.parse(encryptedData);
    } catch (e) {
      console.error('Failed to parse as JSON after decryption failed:', e);
      // Return a default value instead of throwing an error
      return encryptedData;
    }
  }
};

export const saveTasks = (tasks: TasksByDate, userId?: string): void => {
  try {
    const encryptedData = encrypt(tasks, userId);
    localStorage.setItem(STORAGE_KEY, encryptedData);
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

export const loadTasks = (userId?: string): TasksByDate => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) return {};
    
    const decryptedTasks = decrypt(savedTasks, userId);
    
    // Verify the decrypted tasks have the expected structure
    if (typeof decryptedTasks !== 'object' || decryptedTasks === null) {
      console.warn('Loaded tasks are not in the expected format:', decryptedTasks);
      return {};
    }
    
    return decryptedTasks;
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return {};
  }
};
