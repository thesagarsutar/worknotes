
export interface Task {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  priority: 'none' | 'low' | 'medium' | 'high';
  date: string; // ISO date string YYYY-MM-DD
  hasReminder?: boolean; // Optional for backward compatibility with existing tasks
}

export interface TasksByDate {
  [date: string]: Task[];
}
