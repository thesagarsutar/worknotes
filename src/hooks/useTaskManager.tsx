
import { useState, useEffect } from "react";
import { Task, TasksByDate } from "@/lib/types";
import { 
  generateId, 
  getTodayDate, 
  processMarkdown,
  moveForwardUncompletedTasks
} from "@/lib/utils";
import { loadTasks, saveTasks } from "@/lib/storage";
import { useToast } from "@/components/ui/use-toast";

export const useTaskManager = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { toast } = useToast();

  // Load tasks on mount
  useEffect(() => {
    const savedTasks = loadTasks();
    
    const updatedTasks = moveForwardUncompletedTasks(savedTasks, currentDate);
    setTasksByDate(updatedTasks);
    
    if (JSON.stringify(savedTasks) !== JSON.stringify(updatedTasks)) {
      saveTasks(updatedTasks);
      
      const hasTasks = Object.keys(updatedTasks).some(date => 
        date === currentDate && 
        updatedTasks[date].some(task => 
          task.createdAt.split('T')[0] !== currentDate
        )
      );
      
      if (hasTasks) {
        toast({
          title: "Uncompleted tasks moved to today",
          description: "Tasks from previous days have been carried forward."
        });
      }
    }
  }, []);

  // Save tasks when they change
  useEffect(() => {
    saveTasks(tasksByDate);
  }, [tasksByDate]);

  // Add a new task to the current date
  const handleAddTask = (content: string) => {
    const { isTask, isCompleted, content: taskContent } = processMarkdown(content);
    const newTaskContent = isTask ? taskContent : content.slice(4);
    
    const newTask: Task = {
      id: generateId(),
      content: newTaskContent,
      isCompleted: isCompleted,
      createdAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : null,
      priority: 'medium', // Set medium as default priority
      date: currentDate,
    };

    setTasksByDate(prev => {
      const updatedTasks = { ...prev };
      
      if (!updatedTasks[currentDate]) {
        updatedTasks[currentDate] = [];
      }
      
      updatedTasks[currentDate] = [...updatedTasks[currentDate], newTask];
      return updatedTasks;
    });
  };

  // Add a new date section
  const handleAddDate = (date: string) => {
    setCurrentDate(date);
    
    setTasksByDate(prev => {
      if (!prev[date]) {
        return { ...prev, [date]: [] };
      }
      return prev;
    });
    
    toast({
      title: `Date set to ${new Date(date).toLocaleDateString()}`,
      description: "New tasks will be added to this date."
    });
  };

  // Toggle task completion status
  const handleTaskStatusChange = (id: string, isCompleted: boolean) => {
    setTasksByDate(prev => {
      const updatedTasks = { ...prev };
      
      for (const date of Object.keys(updatedTasks)) {
        const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          updatedTasks[date] = [...updatedTasks[date]];
          updatedTasks[date][taskIndex] = {
            ...updatedTasks[date][taskIndex],
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
          };
          break;
        }
      }
      
      return updatedTasks;
    });
  };

  // Update task content
  const handleTaskUpdate = (id: string, content: string) => {
    setTasksByDate(prev => {
      const updatedTasks = { ...prev };
      
      for (const date of Object.keys(updatedTasks)) {
        const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          updatedTasks[date] = [...updatedTasks[date]];
          updatedTasks[date][taskIndex] = {
            ...updatedTasks[date][taskIndex],
            content,
          };
          break;
        }
      }
      
      return updatedTasks;
    });
  };

  // Change task priority
  const handleTaskPriorityChange = (id: string, priority: Task["priority"]) => {
    setTasksByDate(prev => {
      const updatedTasks = { ...prev };
      
      for (const date of Object.keys(updatedTasks)) {
        const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          updatedTasks[date] = [...updatedTasks[date]];
          updatedTasks[date][taskIndex] = {
            ...updatedTasks[date][taskIndex],
            priority,
          };
          break;
        }
      }
      
      return updatedTasks;
    });
  };

  // Delete a task
  const handleTaskDelete = (taskId: string) => {
    setTasksByDate(prev => {
      const newTasks = { ...prev };
      
      for (const date of Object.keys(newTasks)) {
        newTasks[date] = newTasks[date].filter(task => task.id !== taskId);
        
        if (newTasks[date].length === 0) {
          delete newTasks[date];
        }
      }
      
      return newTasks;
    });
  };

  // Move a task from one date to another
  const handleTaskMove = (taskId: string, fromDate: string, toDate: string) => {
    setTasksByDate(prev => {
      const newTasks = { ...prev };
      const taskIndex = newTasks[fromDate].findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) return prev;
      
      const [task] = newTasks[fromDate].splice(taskIndex, 1);
      
      if (!newTasks[toDate]) {
        newTasks[toDate] = [];
      }
      
      newTasks[toDate].push({
        ...task,
        date: toDate
      });
      
      if (newTasks[fromDate].length === 0) {
        delete newTasks[fromDate];
      }
      
      return newTasks;
    });
  };

  // Reorder tasks within a date section
  const handleTaskReorder = (fromIndex: number, toIndex: number, date: string) => {
    setTasksByDate(prev => {
      const newTasks = { ...prev };
      const dateTasksCopy = [...newTasks[date]];
      const [movedTask] = dateTasksCopy.splice(fromIndex, 1);
      dateTasksCopy.splice(toIndex, 0, movedTask);
      newTasks[date] = dateTasksCopy;
      return newTasks;
    });
  };

  // Set the current date and scroll to it
  const handleDateClick = (date: string) => {
    setCurrentDate(date);
  };

  return {
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
  };
};
