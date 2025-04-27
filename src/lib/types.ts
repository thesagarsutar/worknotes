
export interface Task {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  priority: 'none' | 'low' | 'medium' | 'high';
  date: string; // ISO date string YYYY-MM-DD
}

export interface TasksByDate {
  [date: string]: Task[];
}
