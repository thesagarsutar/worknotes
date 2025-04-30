import { useState, useEffect, useRef } from "react";
import { Task, TasksByDate } from "@/lib/types";
import { 
  generateId, 
  getTodayDate, 
  processMarkdown,
  moveForwardUncompletedTasks
} from "@/lib/utils";
import { loadTasks, saveTasks } from "@/lib/storage";
import TodoInput from "./TodoInput";
import DateSection from "./DateSection";
import ThemeToggle from "./ThemeToggle";
import DateIndex from "./DateIndex";
import { useToast } from "@/components/ui/use-toast";

const TodoPage = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { toast } = useToast();

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

  useEffect(() => {
    saveTasks(tasksByDate);
  }, [tasksByDate]);

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

  const handleDateClick = (date: string) => {
    setCurrentDate(date);
  };

  // Get sorted dates for the DateIndex component
  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <div className="editor-container relative">
      <ThemeToggle />
      <TodoInput onAddTask={handleAddTask} onAddDate={handleAddDate} />
      {sortedDates.length > 0 && (
        <DateIndex dates={sortedDates} onDateClick={handleDateClick} />
      )}
      {sortedDates
        .reverse()
        .map(date => (
          <DateSection
            key={date}
            date={date}
            tasks={tasksByDate[date]}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskPriorityChange={handleTaskPriorityChange}
            onTaskMove={handleTaskMove}
            onTaskReorder={handleTaskReorder}
          />
        ))}
    </div>
  );
};

export default TodoPage;
