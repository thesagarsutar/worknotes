
import { useState, useEffect, useRef } from "react";
import { Task, TasksByDate } from "@/lib/types";
import { 
  generateId, 
  getTodayDate, 
  processMarkdown,
  moveForwardUncompletedTasks
} from "@/lib/utils";
import { loadTasks, saveTasks, encrypt, decrypt } from "@/lib/storage";
import TodoInput from "./TodoInput";
import DateSection from "./DateSection";
import DateIndex from "./DateIndex";
import SettingsMenu from "./SettingsMenu";
import { tasksToMarkdown, downloadMarkdownFile, markdownToTasks, createFileInput, mergeTasks } from "@/lib/markdown";
import ImportNotification from "./ImportNotification";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from 'uuid';

const TodoPage = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const { user, isLoading: authLoading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(true);
  const previousTasksRef = useRef<string>("");
  const lastUserIdRef = useRef<string | null>(null);
  const [importNotification, setImportNotification] = useState({
    isVisible: false,
    message: ''
  });

  // Export tasks as markdown
  const handleExportMarkdown = () => {
    const markdown = tasksToMarkdown(tasksByDate);
    downloadMarkdownFile(markdown, `tasks-${getTodayDate()}.md`);
  };

  // Import tasks from markdown
  const handleImportMarkdown = () => {
    createFileInput((content) => {
      try {
        const importedTasks = markdownToTasks(content);
        
        if (Object.keys(importedTasks).length === 0) {
          setImportNotification({
            isVisible: true,
            message: 'No valid tasks found in the imported file'
          });
          return;
        }
        
        // Count tasks to be imported
        let taskCount = 0;
        Object.values(importedTasks).forEach(tasks => {
          taskCount += tasks.length;
        });
        
        // Merge imported tasks with existing tasks
        const mergedTasks = mergeTasks(tasksByDate, importedTasks);
        
        // Update state with merged tasks
        setTasksByDate(mergedTasks);
        
        // Show notification
        setImportNotification({
          isVisible: true,
          message: `Successfully imported ${taskCount} tasks`
        });
      } catch (error) {
        console.error('Import error:', error);
        setImportNotification({
          isVisible: true,
          message: 'Error importing tasks. Invalid file format.'
        });
      }
    });
  };

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
      
      // Detect user login/logout by comparing current and previous user
      const isUserChanged = (user?.id || null) !== lastUserIdRef.current;
      lastUserIdRef.current = user?.id || null;
      
      // Always load local tasks first - use user ID for decryption if available
      const localTasks = loadTasks(user?.id);
      
      if (user) {
        try {
          // User is authenticated, fetch tasks from Supabase
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error loading tasks from Supabase:", error);
            
            // Use local tasks as fallback
            processLoadedTasks(localTasks);
          } else if (data) {
            // Convert Supabase tasks to our app format
            const supabaseTasks: TasksByDate = {};
            
            for (const task of data) {
              if (!supabaseTasks[task.date]) {
                supabaseTasks[task.date] = [];
              }
              
              // Decrypt the content if it's encrypted
              let content = task.content;
              try {
                content = decrypt(content, user.id);
              } catch (e) {
                // If decryption fails, assume it's not encrypted yet
                console.log("Task content might not be encrypted yet:", e);
              }
              
              supabaseTasks[task.date].push({
                id: task.id,
                content: content,
                isCompleted: task.is_completed,
                createdAt: task.created_at,
                completedAt: task.completed_at,
                priority: task.priority as Task["priority"],
                date: task.date
              });
            }
            
            // When user just logged in, or it's first sync, merge local and remote tasks
            if (isUserChanged || isInitialSync) {
              // Merge local and Supabase tasks on first sync after login
              const mergedTasks = mergeTasks(localTasks, supabaseTasks);
              processLoadedTasks(mergedTasks);
              
              // If we merged tasks and local had tasks, immediately sync back to Supabase
              if (Object.keys(localTasks).length > 0) {
                // We'll let the useEffect for tasksByDate handle this sync
                console.log("Local tasks merged with remote, will sync back soon");
              }
              
              setIsInitialSync(false);
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
      saveTasks(updatedTasks, user?.id);
    }
    
    // Store the initial state to check for changes later
    previousTasksRef.current = JSON.stringify(updatedTasks);
  };

  // Save tasks to localStorage and Supabase if authenticated
  useEffect(() => {
    const saveTasksData = async () => {
      if (isInitialLoad) return; // Skip during initial load
      
      // Always save to localStorage as a backup - use user ID for encryption if available
      saveTasks(tasksByDate, user?.id);
      
      // Store current state as a string for comparison
      const currentTasksJson = JSON.stringify(tasksByDate);
      
      // If authenticated and there are actual changes in the tasks, sync with Supabase
      if (user && !isSyncing && currentTasksJson !== previousTasksRef.current) {
        try {
          setIsSyncing(true);

          // Format tasks for Supabase
          const supabaseTasks = [];
          
          for (const date of Object.keys(tasksByDate)) {
            for (const task of tasksByDate[date]) {
              // Ensure task ID is a valid UUID before sending to Supabase
              const safeId = ensureValidUUID(task.id);
              
              // Encrypt the task content before sending to Supabase
              const encryptedContent = encrypt(task.content, user.id);
              
              // Make sure data types match expected schema
              supabaseTasks.push({
                id: safeId,
                user_id: user.id,
                content: encryptedContent, // Store encrypted content
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
          }
          
          // Update the previous state reference to the current state
          previousTasksRef.current = currentTasksJson;
        } catch (err) {
          console.error("Error in Supabase task saving:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    saveTasksData();
  }, [tasksByDate, user, isInitialLoad, isSyncing]);

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
      <SettingsMenu 
        onExportMarkdown={handleExportMarkdown} 
        onImportMarkdown={handleImportMarkdown} 
      />
      {isSyncing && (
        <div className="fixed bottom-4 right-16 z-10 text-blue-500 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud-upload">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m16 16-4-4-4 4"></path>
          </svg>
        </div>
      )}
      <ImportNotification 
        isVisible={importNotification.isVisible}
        message={importNotification.message}
        onDismiss={() => setImportNotification({ isVisible: false, message: '' })}
      />
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
