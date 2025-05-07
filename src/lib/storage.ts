
import { Task, TasksByDate } from './types';
import { encryptData, decryptData, isEncrypted } from './encryption';

const STORAGE_KEY = 'smart-todo-tasks';

/**
 * Encrypt data for local storage
 * @param data Data to encrypt
 * @param userId Optional user ID for user-specific encryption
 * @returns Encrypted string
 */
const encrypt = (data: any, userId?: string): string => {
  return encryptData(data, userId);
};

/**
 * Decrypt data from local storage
 * @param data Possibly encrypted data
 * @param userId Optional user ID used for encryption
 * @returns Decrypted data or original if not encrypted
 */
const decrypt = (data: string, userId?: string): any => {
  return decryptData(data, userId);
};

/**
 * Save tasks to local storage with encryption
 * @param tasks Tasks to save
 * @param userId Optional user ID for encryption
 */
export const saveTasks = (tasks: TasksByDate, userId?: string): void => {
  try {
    // Encrypt the tasks data
    const encryptedData = encrypt(tasks, userId);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, encryptedData);
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

/**
 * Load tasks from local storage with decryption
 * @param userId Optional user ID used for encryption
 * @returns TasksByDate object
 */
export const loadTasks = (userId?: string): TasksByDate => {
  try {
    // Get data from localStorage
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) return {};
    
    // Attempt to decrypt the data
    const decryptedData = decrypt(savedTasks, userId);
    
    // Validate that we got a proper TasksByDate object
    if (typeof decryptedData !== 'object' || decryptedData === null) {
      console.warn('Invalid data format in localStorage, returning empty object');
      return {};
    }
    
    // Ensure each date entry is an array
    const validatedTasks: TasksByDate = {};
    
    Object.keys(decryptedData).forEach(date => {
      if (Array.isArray(decryptedData[date])) {
        validatedTasks[date] = decryptedData[date];
      } else {
        console.warn(`Tasks for date ${date} is not an array, skipping`);
      }
    });
    
    return validatedTasks;
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return {};
  }
};
