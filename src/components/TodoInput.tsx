
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { processMarkdown, processDateCommand } from "@/lib/utils";
import { playTaskAddSound } from "@/lib/sound-utils";
import { Task } from "@/lib/types";
import { Bell, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";

interface TodoInputProps {
  onAddTask: (content: string, priority: Task["priority"], hasReminder: boolean) => void;
  onAddDate: (date: string) => void;
}

const TodoInput = ({ onAddTask, onAddDate }: TodoInputProps) => {
  const [input, setInput] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Task["priority"]>("medium");
  const [hasReminder, setHasReminder] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Show controls when user starts typing with a delay
  useEffect(() => {
    let typingTimer: NodeJS.Timeout | null = null;
    
    // Check if input contains at least one word (non-whitespace characters)
    if (/\S+/.test(input)) {
      // Set a delay before showing the controls
      typingTimer = setTimeout(() => {
        setShowControls(true);
      }, 250); // 800ms delay before showing controls
    } else {
      // Hide controls when input is empty
      setShowControls(false);
    }
    
    // Cleanup function to clear the timer when component unmounts or input changes
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
      // Prevent default behavior (new line)
      e.preventDefault();
      
      // Process the input text
      const dateCommand = processDateCommand(input.trim());
      
      if (dateCommand.isDateCommand && dateCommand.date) {
        onAddDate(dateCommand.date);
      } else {
        const markdownResult = processMarkdown(input.trim());
        
        if (markdownResult.isTask) {
          onAddTask(input.trim(), selectedPriority, hasReminder);
        } else {
          // For now, treat any non-command text as a task
          onAddTask(`[ ] ${input.trim()}`, selectedPriority, hasReminder);
        }
      }
      
      // Play sound effect for adding a task
      if (!dateCommand.isDateCommand) {
        playTaskAddSound();
      }
      
      // Clear the input but keep the priority and reminder settings
      setInput("");
      
      // Re-focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const handlePriorityChange = (priority: Task["priority"]) => {
    setSelectedPriority(priority);
  };
  
  const toggleReminder = () => {
    setHasReminder(!hasReminder);
  };
  
  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "text-priority-high";
      case "medium":
        return "text-priority-medium";
      case "low":
        return "text-priority-low";
      default:
        return "text-muted-foreground";
    }
  };
  
  // Get the next priority in the cycle
  const getNextPriority = (current: Task["priority"]): Task["priority"] => {
    switch (current) {
      case "none":
        return "low";
      case "low":
        return "medium";
      case "medium":
        return "high";
      case "high":
        return "none";
      default:
        return "medium";
    }
  };

  return (
    <div className="todo-input-container mb-4">
      <div className="flex items-center gap-2 mb-8 h-6">
        {/* Priority Selection Button - Single button with label */}
        <div className="flex-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }}>
          <button
            type="button"
            onClick={() => handlePriorityChange(getNextPriority(selectedPriority))}
            className="flex items-center gap-1.5 pl-0 pr-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Current priority: ${selectedPriority}`}
            title="Change priority"
            disabled={!showControls}
          >
            {selectedPriority === "none" ? (
              <div className="w-[4px] h-4 rounded-sm bg-muted-foreground/30"></div>
            ) : (
              <div 
                className="w-[4px] h-4 rounded-sm" 
                style={{
                  backgroundColor: selectedPriority === "high" ? "hsl(0 84% 60% / 0.6)" :
                                  selectedPriority === "medium" ? "hsl(35 95% 62% / 0.6)" :
                                  "hsl(140 63% 42% / 0.6)"
                }}
              ></div>
            )}
            <span>{selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}</span>
          </button>
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Reminder Toggle Button */}
        <div className="flex-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }}>
          <button
            type="button"
            onClick={toggleReminder}
            className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={hasReminder ? "Remove reminder" : "Add reminder"}
            title="Toggle Reminder"
            disabled={!showControls}
          >
            <Bell className="h-4 w-4" />
            <span>Remind</span>
          </button>
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add new task or type /DD-MM-YY to add a day"
        className="w-full border-none bg-transparent px-0 py-2 text-lg focus:outline-none focus:ring-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
        style={{ height: '72px' }} /* 3x the height of the original input */
        autoComplete="off"
        aria-label="New task input"
      />
    </div>
  );
};

export default TodoInput;
