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
import DateIndex from "./DateIndex";
import SettingsMenu from "./SettingsMenu";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TodoPage = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { toast } = useToast();
  const { user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load tasks from localStorage or Supabase depending on auth status
  useEffect(() => {
    const loadTasksData = async () => {
      setIsInitialLoad(true);
      
      if (user) {
        // User is authenticated, load tasks from Supabase
        try {
          setIsSyncing(true);
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error loading tasks from Supabase:", error);
            toast({
              title: "Error syncing tasks",
              description: "Failed to load your tasks from the cloud",
              variant: "destructive"
            });
            // Fallback to local storage
            const localTasks = loadTasks();
            processLoadedTasks(localTasks);
          } else if (data) {
            // Convert Supabase tasks to our app format
            const supabaseTasks: TasksByDate = {};
            data.forEach(task => {
              if (!supabaseTasks[task.date]) {
                supabaseTasks[task.date] = [];
              }
              
              supabaseTasks[task.date].push({
                id: task.id,
                content: task.content,
                isCompleted: task.is_completed,
                createdAt: task.created_at,
                completedAt: task.completed_at,
                priority: task.priority as Task["priority"],
                date: task.date
              });
            });
            
            processLoadedTasks(supabaseTasks);
            toast({
              title: "Tasks synced",
              description: "Your tasks were loaded from the cloud"
            });
          }
        } catch (err) {
          console.error("Error in Supabase task loading:", err);
          // Fallback to local storage
          const localTasks = loadTasks();
          processLoadedTasks(localTasks);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // No user authenticated, use localStorage
        const localTasks = loadTasks();
        processLoadedTasks(localTasks);
      }
      
      setIsInitialLoad(false);
    };
    
    loadTasksData();
  }, [user]);

  // Process loaded tasks from any source
  const processLoadedTasks = (loadedTasks: TasksByDate) => {
    const updatedTasks = moveForwardUncompletedTasks(loadedTasks, currentDate);
    setTasksByDate(updatedTasks);
    
    if (JSON.stringify(loadedTasks) !== JSON.stringify(updatedTasks)) {
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
  };

  // Save tasks to localStorage and Supabase if authenticated
  useEffect(() => {
    const saveTasksData = async () => {
      if (isInitialLoad) return; // Skip during initial load
      
      // Always save to localStorage as a backup
      saveTasks(tasksByDate);
      
      // If authenticated, sync with Supabase
      if (user && !isSyncing) {
        try {
          // First, clear old tasks for this user
          await supabase
            .from('tasks')
            .delete()
            .eq('user_id', user.id);
          
          // Then insert all current tasks
          const supabaseTasks = [];
          for (const date of Object.keys(tasksByDate)) {
            for (const task of tasksByDate[date]) {
              supabaseTasks.push({
                id: task.id,
                user_id: user.id,
                content: task.content,
                is_completed: task.isCompleted,
                created_at: task.createdAt,
                completed_at: task.completedAt,
                priority: task.priority,
                date: task.date
              });
            }
          }
          
          if (supabaseTasks.length > 0) {
            const { error } = await supabase
              .from('tasks')
              .upsert(supabaseTasks);
              
            if (error) {
              console.error("Error syncing tasks to Supabase:", error);
            }
          }
        } catch (err) {
          console.error("Error in Supabase task saving:", err);
        }
      }
    };
    
    saveTasksData();
  }, [tasksByDate, user, isInitialLoad, isSyncing]);

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
      <TodoInput onAddTask={handleAddTask} onAddDate={handleAddDate} />
      <SettingsMenu />
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
