
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { processMarkdown, processDateCommand } from "@/lib/utils";
import { playTaskAddSound } from "@/lib/sound-utils";
import { Task, TasksByDate } from "@/lib/types";
import { Bell, CircleDot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { useSuggestions } from "@/hooks/useSuggestions";
import { getCaretCoordinates } from "@/lib/textarea-caret-position";

interface TodoInputProps {
  onAddTask: (content: string, priority: Task["priority"], hasReminder: boolean) => void;
  onAddDate: (date: string) => void;
  tasksByDate?: TasksByDate;
}

const TodoInput = ({ onAddTask, onAddDate, tasksByDate }: TodoInputProps) => {
  const [selectedPriority, setSelectedPriority] = useState<Task["priority"]>("medium");
  const [hasReminder, setHasReminder] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [caretCoordinates, setCaretCoordinates] = useState({ top: 8, left: 0, height: 24 });
  const [showSuggestionHint, setShowSuggestionHint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use our custom hook for text suggestions with task context
  const { 
    inputText: input, 
    setInputText: setInput, 
    suggestion, 
    suggestionWords,
    isLoading,
    aiEnabled,
    clearSuggestion
  } = useSuggestions(tasksByDate);

  // Focus textarea on component mount and set initial height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
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
      }, 250); // 250ms delay before showing controls
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
  
  // Show suggestion hint when a suggestion is available
  useEffect(() => {
    if (suggestion && !showSuggestionHint) {
      setShowSuggestionHint(true);
    } else if (!suggestion) {
      setShowSuggestionHint(false);
    }
  }, [suggestion]);
  
  // Handle cursor position changes, adjust textarea height, and update caret coordinates
  const handleCursorChange = () => {
    if (textareaRef.current) {
      const position = textareaRef.current.selectionStart;
      setCursorPosition(position);
      
      // Get caret coordinates for suggestion positioning
      const coordinates = getCaretCoordinates(textareaRef.current, position);
      setCaretCoordinates(coordinates);
      
      // Auto-adjust height
      adjustTextareaHeight();
    }
  };
  
  // Function to adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto so we can get the scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to the scrollHeight (content height)
    // Use 80px as min-height to accommodate 2 lines of text (double the original height)
    const newHeight = Math.max(textarea.scrollHeight, 80); // 80px as min-height for 2 lines
    textarea.style.height = `${newHeight}px`;
  };
  
  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    handleCursorChange();
    // Adjust height when input changes
    adjustTextareaHeight();
  };
  
  // Accept the entire suggestion
  const acceptFullSuggestion = () => {
    if (suggestion) {
      // Check if the suggestion starts with a space but the input already ends with one
      let suggestionToAdd = suggestion;
      if (suggestion.startsWith(' ') && input.endsWith(' ')) {
        // Remove the extra space from the beginning of the suggestion
        suggestionToAdd = suggestion.substring(1);
      }
      
      // Update input and immediately clear the current suggestion
      // Add a space after the suggestion unless it already ends with one
      const newText = input + suggestionToAdd + (!suggestionToAdd.endsWith(' ') ? ' ' : '');
      setInput(newText);
      
      // Clear the current suggestion since we've added a space and will be typing a new word
      clearSuggestion();
      
      // Manually update the cursor position
      if (textareaRef.current) {
        // Set cursor to the end of the text
        const newPosition = newText.length;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        setCursorPosition(newPosition);
        
        // Force a refocus to trigger the suggestion update
        textareaRef.current.blur();
        textareaRef.current.focus();
      }
    }
  };
  
  // Accept just the next word of the suggestion
  const acceptNextWord = () => {
    if (suggestionWords.length > 0 && input) {
      const nextWord = suggestionWords[0];
      
      // Always add a space if the input doesn't end with a space
      const needsSpace = input.length > 0 && input.charAt(input.length - 1) !== ' ';
      
      // Update input with the next word from suggestion, adding space if needed
      const newText = needsSpace ? `${input} ${nextWord}` : `${input}${nextWord}`;
      
      setInput(newText);
      
      // Manually update the cursor position
      if (textareaRef.current) {
        // Set cursor to the end of the text
        const newPosition = newText.length;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        setCursorPosition(newPosition);
        
        // Force a refocus to trigger the suggestion update
        textareaRef.current.blur();
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for accepting the full suggestion
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      acceptFullSuggestion();
      return;
    }
    
    // Handle Right Arrow key for accepting the next word
    if (e.key === 'ArrowRight' && suggestionWords.length > 0 && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Only accept if cursor is at the end of the input
      if (textareaRef.current && textareaRef.current.selectionStart === input.length) {
        e.preventDefault();
        acceptNextWord();
        return;
      }
    }

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
      
      <div className="relative">
        <textarea
          className="w-full resize-none bg-transparent outline-none py-2 placeholder:text-muted-foreground/50 text-lg overflow-hidden"
          placeholder="Add new task or type /DD-MM-YY to add a day"
          rows={1}
          style={{ minHeight: '80px' }}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={handleCursorChange}
          ref={textareaRef}
          aria-label="New task input"
        />
        
        {/* Word-based suggestion overlay positioned at caret */}
        {suggestion && cursorPosition === input.length && (
          <div 
            className="absolute pointer-events-none text-muted-foreground/40"
            style={{
              fontSize: '19px', // Increased by 1px from the default text-lg (18px)
              top: `${caretCoordinates.top - 2}px`, // Position slightly above the caret's vertical position
              left: `${caretCoordinates.left}px`, // Position at the caret's horizontal position
              maxWidth: 'calc(100% - 16px)', // Allow suggestion to wrap if needed
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            {suggestion}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoInput;
