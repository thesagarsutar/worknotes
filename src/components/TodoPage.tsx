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
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

const TodoPage = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { toast: uiToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(true);

  // Helper function to validate UUID
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Helper function to ensure valid UUID
  const ensureValidUUID = (id: string): string => {
    return isValidUUID(id) ? id : uuidv4();
  };

  // Load tasks from localStorage or Supabase depending on auth status
  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be resolved
    
    const loadTasksData = async () => {
      setIsInitialLoad(true);
      setIsSyncing(true);
      
      // Always load local tasks first
      const localTasks = loadTasks();
      
      if (user) {
        try {
          // User is authenticated, fetch tasks from Supabase
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error loading tasks from Supabase:", error);
            toast.error("Failed to load your tasks from the cloud");
            
            // Use local tasks as fallback
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
            
            if (isInitialSync) {
              // Merge local and Supabase tasks on first sync after login
              const mergedTasks = mergeTasks(localTasks, supabaseTasks);
              processLoadedTasks(mergedTasks);
              setIsInitialSync(false);
              toast.success("Your tasks have been synced from the cloud");
            } else {
              processLoadedTasks(supabaseTasks);
            }
          }
        } catch (err) {
          console.error("Error in Supabase task loading:", err);
          // Fallback to local storage
          processLoadedTasks(localTasks);
        }
      } else {
        // No user authenticated, use localStorage only
        processLoadedTasks(localTasks);
        setIsInitialSync(true); // Reset initial sync flag when logged out
      }
      
      setIsSyncing(false);
      setIsInitialLoad(false);
    };
    
    loadTasksData();
  }, [user, authLoading]);

  // Merge local and Supabase tasks, preferring newer tasks when conflicts occur
  const mergeTasks = (localTasks: TasksByDate, supabaseTasks: TasksByDate): TasksByDate => {
    const mergedTasks: TasksByDate = { ...supabaseTasks };
    
    // Add tasks from local storage that don't exist in Supabase
    Object.keys(localTasks).forEach(date => {
      if (!mergedTasks[date]) {
        mergedTasks[date] = [];
      }
      
      localTasks[date].forEach(localTask => {
        // Ensure the localTask has a valid UUID
        const safeLocalTask = {
          ...localTask,
          id: ensureValidUUID(localTask.id)
        };
        
        // Check if this task exists in the supabase tasks by content matching
        const existingTaskIndex = mergedTasks[date].findIndex(
          task => task.content === safeLocalTask.content && task.date === safeLocalTask.date
        );
        
        if (existingTaskIndex === -1) {
          // Task doesn't exist in Supabase, add it
          mergedTasks[date].push(safeLocalTask);
        } else {
          // Task exists, keep the one that was most recently modified
          const existingTask = mergedTasks[date][existingTaskIndex];
          const existingTaskTimestamp = existingTask.completedAt 
            ? new Date(existingTask.completedAt).getTime() 
            : new Date(existingTask.createdAt).getTime();
          
          const localTaskTimestamp = safeLocalTask.completedAt 
            ? new Date(safeLocalTask.completedAt).getTime() 
            : new Date(safeLocalTask.createdAt).getTime();
          
          if (localTaskTimestamp > existingTaskTimestamp) {
            mergedTasks[date][existingTaskIndex] = {
              ...safeLocalTask,
              id: existingTask.id // Keep the existing ID
            };
          }
        }
      });
    });
    
    return mergedTasks;
  };

  // Process loaded tasks from any source
  const processLoadedTasks = (loadedTasks: TasksByDate) => {
    // Ensure all tasks have valid UUIDs
    const sanitizedTasks: TasksByDate = {};
    Object.keys(loadedTasks).forEach(date => {
      sanitizedTasks[date] = loadedTasks[date].map(task => ({
        ...task,
        id: ensureValidUUID(task.id)
      }));
    });
    
    const updatedTasks = moveForwardUncompletedTasks(sanitizedTasks, currentDate);
    setTasksByDate(updatedTasks);
    
    if (JSON.stringify(sanitizedTasks) !== JSON.stringify(updatedTasks)) {
      saveTasks(updatedTasks);
      
      const hasTasks = Object.keys(updatedTasks).some(date => 
        date === currentDate && 
        updatedTasks[date].some(task => 
          task.createdAt.split('T')[0] !== currentDate
        )
      );
      
      if (hasTasks) {
        uiToast({
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
          setIsSyncing(true);

          // Format tasks for Supabase
          const supabaseTasks = [];
          
          for (const date of Object.keys(tasksByDate)) {
            for (const task of tasksByDate[date]) {
              // Ensure task ID is a valid UUID before sending to Supabase
              const safeId = ensureValidUUID(task.id);
              
              // Make sure data types match expected schema
              supabaseTasks.push({
                id: safeId,
                user_id: user.id,
                content: task.content,
                is_completed: !!task.isCompleted, // Ensure boolean
                created_at: task.createdAt,
                completed_at: task.completedAt,
                priority: task.priority,
                date: task.date
              });
            }
          }
          
          if (supabaseTasks.length > 0) {
            // First, clear old tasks for this user
            const { error: deleteError } = await supabase
              .from('tasks')
              .delete()
              .eq('user_id', user.id);
              
            if (deleteError) {
              console.error("Error deleting old tasks:", deleteError);
              toast.error("Failed to sync your tasks to the cloud");
              setIsSyncing(false);
              return;
            }
            
            // Then insert all current tasks
            // Insert tasks in batches to avoid payload size issues
            const BATCH_SIZE = 50;
            let hasError = false;
            
            for (let i = 0; i < supabaseTasks.length; i += BATCH_SIZE) {
              const batch = supabaseTasks.slice(i, i + BATCH_SIZE);
              
              const { error: insertError } = await supabase
                .from('tasks')
                .upsert(batch, { 
                  onConflict: 'id',
                  ignoreDuplicates: false
                });
                
              if (insertError) {
                console.error("Error syncing tasks to Supabase:", insertError);
                hasError = true;
                break;
              }
            }
            
            if (hasError) {
              toast.error("Failed to save your tasks to the cloud");
            } else if (!isInitialSync) {
              // Only show sync success toast after initial sync
              toast.success("Tasks saved to cloud");
            }
          }
        } catch (err) {
          console.error("Error in Supabase task saving:", err);
          toast.error("Failed to save your tasks to the cloud");
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    saveTasksData();
  }, [tasksByDate, user, isInitialLoad, isSyncing, isInitialSync]);

  const handleAddTask = (content: string) => {
    const { isTask, isCompleted, content: taskContent } = processMarkdown(content);
    const newTaskContent = isTask ? taskContent : content.slice(4);
    
    const newTask: Task = {
      id: uuidv4(), // Use uuid v4 to ensure valid UUID
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
    
    uiToast({
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
