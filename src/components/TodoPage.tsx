
import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";

const TodoPage = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { toast } = useToast();

  // Load tasks from storage on initial render
  useEffect(() => {
    const savedTasks = loadTasks();
    
    // Move forward uncompleted tasks from past dates to today
    const updatedTasks = moveForwardUncompletedTasks(savedTasks, currentDate);
    setTasksByDate(updatedTasks);
    
    // Save the updated tasks with forward-moved tasks
    if (JSON.stringify(savedTasks) !== JSON.stringify(updatedTasks)) {
      saveTasks(updatedTasks);
      
      // Show toast if tasks were moved forward
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

  // Save tasks to storage whenever they change
  useEffect(() => {
    saveTasks(tasksByDate);
  }, [tasksByDate]);

  // Add a new task
  const handleAddTask = (content: string) => {
    // Process markdown to check if it's a task and if it's completed
    const { isTask, isCompleted, content: taskContent } = processMarkdown(content);
    
    // If not explicitly a task, we've already prefixed with "[ ]" in TodoInput
    const newTaskContent = isTask ? taskContent : content.slice(4);
    
    const newTask: Task = {
      id: generateId(),
      content: newTaskContent,
      isCompleted: isCompleted,
      createdAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : null,
      priority: 'none',
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

  // Set the current date (used when adding date sections)
  const handleAddDate = (date: string) => {
    setCurrentDate(date);
    
    // Create the date section if it doesn't exist
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

  // Update task completion status
  const handleTaskStatusChange = (id: string, isCompleted: boolean) => {
    setTasksByDate(prev => {
      const updatedTasks = { ...prev };
      
      // Find the task in any date
      for (const date of Object.keys(updatedTasks)) {
        const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          // Update the task
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
      
      // Find the task in any date
      for (const date of Object.keys(updatedTasks)) {
        const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          // Update the task
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

  // Render date sections in reverse chronological order
  const renderDateSections = () => {
    const dates = Object.keys(tasksByDate).sort().reverse();
    
    return dates.map(date => (
      <DateSection
        key={date}
        date={date}
        tasks={tasksByDate[date]}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskUpdate={handleTaskUpdate}
      />
    ));
  };

  return (
    <div className="editor-container">
      <ThemeToggle />
      <TodoInput onAddTask={handleAddTask} onAddDate={handleAddDate} />
      {renderDateSections()}
    </div>
  );
};

export default TodoPage;
