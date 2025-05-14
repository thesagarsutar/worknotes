import { Task, TasksByDate } from './types';
import { generateId, formatDate } from './utils';

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

// Parse markdown to extract tasks by date
export function markdownToTasks(markdown: string): TasksByDate {
  const result: TasksByDate = {};
  let currentDate: string | null = null;
  
  // Split the markdown by lines
  const lines = markdown.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check if line is a date header (## YYYY-MM-DD)
    const dateMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      if (!result[currentDate]) {
        result[currentDate] = [];
      }
      continue;
    }
    
    // If we have a current date and the line is a task
    if (currentDate) {
      const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(.+?)(?:\s+_\(priority:\s+(\w+)\)_)?$/);
      if (taskMatch) {
        const isCompleted = taskMatch[1].toLowerCase() === 'x';
        const content = taskMatch[2].trim();
        let priority: Task['priority'] = 'medium';
        
        // Extract priority if present
        if (taskMatch[3]) {
          const priorityValue = taskMatch[3].toLowerCase();
          if (['none', 'low', 'medium', 'high'].includes(priorityValue)) {
            priority = priorityValue as Task['priority'];
          }
        }
        
        const now = new Date().toISOString();
        
        const task: Task = {
          id: generateId(),
          content,
          isCompleted,
          createdAt: now,
          completedAt: isCompleted ? now : null,
          priority,
          date: currentDate,
        };
        
        result[currentDate].push(task);
      }
    }
  }
  
  return result;
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

// Create an invisible file input for markdown importing
export function createFileInput(onFileSelect: (content: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md';
  input.style.display = 'none';
  
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileSelect(content);
      }
    };
    
    reader.readAsText(file);
  };
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Merge imported tasks with existing tasks
export function mergeTasks(existingTasks: TasksByDate, importedTasks: TasksByDate): TasksByDate {
  const mergedTasks: TasksByDate = { ...existingTasks };
  
  // Process each date in imported tasks
  Object.keys(importedTasks).forEach(date => {
    if (!mergedTasks[date]) {
      // If date doesn't exist in current tasks, add all tasks for this date
      mergedTasks[date] = [...importedTasks[date]];
    } else {
      // If date exists, we need to check for potential duplicates
      importedTasks[date].forEach(importedTask => {
        // Check if a similar task exists (by content)
        const existingTaskIndex = mergedTasks[date].findIndex(
          task => task.content === importedTask.content
        );
        
        if (existingTaskIndex === -1) {
          // No duplicate found, add as new task
          mergedTasks[date].push(importedTask);
        } else {
          // Task with same content found, use the most recent completion status
          const existingTask = mergedTasks[date][existingTaskIndex];
          
          // If imported task has different completion status, update based on priority:
          // Completed tasks take priority over incomplete tasks
          if (existingTask.isCompleted !== importedTask.isCompleted) {
            if (importedTask.isCompleted) {
              // Update existing task to completed if imported task is completed
              mergedTasks[date][existingTaskIndex] = {
                ...existingTask,
                isCompleted: true,
                completedAt: importedTask.completedAt || new Date().toISOString()
              };
            }
            // If existing task is already completed, keep it completed
          }
        }
      });
    }
  });
  
  return mergedTasks;
}
