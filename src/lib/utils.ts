import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task, TasksByDate } from "./types";
import { v4 as uuidv4 } from 'uuid';

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
  return uuidv4();
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

// Format all tasks as markdown, grouped by date
export function tasksToMarkdown(tasksByDate: TasksByDate): string {
  const dates = Object.keys(tasksByDate).sort();
  let md = '';
  for (const date of dates) {
    md += `## ${date}\n`;
    for (const task of tasksByDate[date]) {
      const status = task.isCompleted ? 'x' : ' ';
      md += `- [${status}] ${task.content}`;
      if (task.priority && task.priority !== 'medium') {
        md += ` _(priority: ${task.priority})_`;
      }
      md += '\n';
    }
    md += '\n';
  }
  return md.trim();
}

// Trigger a markdown file download in the browser
export function downloadMarkdownFile(markdown: string, filename = "tasks.md") {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
