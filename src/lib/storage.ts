
import { Task, TasksByDate } from './types';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'smart-todo-tasks';
const ENCRYPTION_KEY = 'smart-todo-encryption-key'; // Default key if no user-specific key

// Helper function to get the encryption key (can be user-specific)
const getEncryptionKey = (userId?: string): string => {
  return userId ? `${ENCRYPTION_KEY}-${userId}` : ENCRYPTION_KEY;
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
  try {
    const key = getEncryptionKey(userId);
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    // If decryption fails, it might be unencrypted data from before
    try {
      return JSON.parse(encryptedData);
    } catch (e) {
      console.error('Error decrypting data:', error);
      return {};
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
    
    return decrypt(savedTasks, userId);
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return {};
  }
};
