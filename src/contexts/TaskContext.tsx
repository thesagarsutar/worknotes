
import { createContext, useContext, ReactNode } from "react";
import { Task, TasksByDate } from "@/lib/types";
import { useTaskManager } from "@/hooks/useTaskManager";

interface TaskContextType {
  tasksByDate: TasksByDate;
  currentDate: string;
  onAddTask: (content: string) => void;
  onAddDate: (date: string) => void;
  onTaskStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskPriorityChange: (id: string, priority: Task["priority"]) => void;
  onTaskMove: (taskId: string, fromDate: string, toDate: string) => void;
  onTaskReorder: (fromIndex: number, toIndex: number, date: string) => void;
  onDateClick: (date: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const {
    tasksByDate,
    currentDate,
    handleAddTask,
    handleAddDate,
    handleTaskStatusChange,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskPriorityChange,
    handleTaskMove,
    handleTaskReorder,
    handleDateClick,
  } = useTaskManager();

  return (
    <TaskContext.Provider
      value={{
        tasksByDate,
        currentDate,
        onAddTask: handleAddTask,
        onAddDate: handleAddDate,
        onTaskStatusChange: handleTaskStatusChange,
        onTaskUpdate: handleTaskUpdate,
        onTaskDelete: handleTaskDelete,
        onTaskPriorityChange: handleTaskPriorityChange,
        onTaskMove: handleTaskMove,
        onTaskReorder: handleTaskReorder,
        onDateClick: handleDateClick,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
