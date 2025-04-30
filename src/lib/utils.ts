
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task, TasksByDate } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function processMarkdown(text: string): { isTask: boolean; isCompleted: boolean; content: string } {
  const todoRegex = /^\s*\[(x| )\]\s(.+)$/i;
  const match = text.match(todoRegex);
  
  if (match) {
    const isCompleted = match[1].toLowerCase() === 'x';
    const content = match[2].trim();
    return { isTask: true, isCompleted, content };
  }
  
  return { isTask: false, isCompleted: false, content: text };
}

export function processDateCommand(text: string): { isDateCommand: boolean; date: string | null } {
  // Match /today or /DD-MM-YY format
  const todayCommandRegex = /^\/today$/i;
  const dateCommandRegex = /^\/(\d{2}-\d{2}-\d{2})$/i;
  
  if (todayCommandRegex.test(text)) {
    return { isDateCommand: true, date: getTodayDate() };
  }
  
  const dateMatch = text.match(dateCommandRegex);
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split('-').map(Number);
    // Convert DD-MM-YY to YYYY-MM-DD format
    const fullYear = 2000 + year; // Assuming years are in the 2000s
    const formattedDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return { isDateCommand: true, date: formattedDate };
  }
  
  return { isDateCommand: false, date: null };
}

export function moveForwardUncompletedTasks(tasks: TasksByDate, toDate: string): TasksByDate {
  const newTasks = { ...tasks };
  const dates = Object.keys(newTasks).sort();
  
  // Don't process the target date or future dates
  const pastDates = dates.filter(date => date < toDate);
  
  pastDates.forEach(date => {
    const uncompletedTasks = newTasks[date].filter(task => !task.isCompleted);
    
    // If we have uncompleted tasks, add them to the target date
    if (uncompletedTasks.length > 0) {
      // Create the target date array if it doesn't exist
      if (!newTasks[toDate]) {
        newTasks[toDate] = [];
      }
      
      // Add each uncompleted task to the target date with a new ID
      uncompletedTasks.forEach(task => {
        newTasks[toDate].push({
          ...task,
          id: generateId(),
          date: toDate,
          // Don't change creation date to preserve history
        });
      });
      
      // Remove the uncompleted tasks from their original date
      newTasks[date] = newTasks[date].filter(task => task.isCompleted);
      
      // If no completed tasks remain, remove the date entirely
      if (newTasks[date].length === 0) {
        delete newTasks[date];
      }
    }
  });
  
  return newTasks;
}
