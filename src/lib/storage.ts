
import { Task, TasksByDate } from './types';

const STORAGE_KEY = 'smart-todo-tasks';

export const saveTasks = (tasks: TasksByDate): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

export const loadTasks = (): TasksByDate => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : {};
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return {};
  }
};
