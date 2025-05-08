
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { processMarkdown, processDateCommand } from "@/lib/utils";
import { playTaskAddSound } from "@/lib/sound-utils";
import { Input } from "@/components/ui/input";
import { getSuggestionFromGemini } from "@/lib/gemini-utils"; 
import { Code } from "lucide-react";

interface TodoInputProps {
  onAddTask: (content: string) => void;
  onAddDate: (date: string) => void;
}

// Local cache for suggestions
const suggestionCache = new Map<string, string>();

const TodoInput = ({ onAddTask, onAddDate }: TodoInputProps) => {
  const [input, setInput] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle input changes and trigger suggestions
  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Clear any existing suggestion when input changes
    setSuggestion("");
    
    // Don't trigger suggestions for empty input or very short inputs
    if (!newValue || newValue.length < 2) return;

    // Check cache first
    if (suggestionCache.has(newValue)) {
      setSuggestion(suggestionCache.get(newValue) || "");
      return;
    }
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounce timer (200ms)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const predictedText = await getSuggestionFromGemini(newValue);
        
        // Only set suggestion if input hasn't changed during API call
        if (newValue === inputRef.current?.value && predictedText) {
          setSuggestion(predictedText);
          
          // Cache the result
          suggestionCache.set(newValue, predictedText);
        }
      } catch (error) {
        console.error("Failed to get suggestion:", error);
        // Graceful failure - just don't show a suggestion
      } finally {
        setIsLoading(false);
      }
    }, 200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestion acceptance with Tab
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setInput(input + suggestion);
      setSuggestion("");
      return;
    }
    
    // Handle right arrow to accept word by word
    if (e.key === "ArrowRight" && suggestion && e.currentTarget.selectionStart === input.length) {
      e.preventDefault();
      // Split suggestion into words and accept the first word
      const words = suggestion.split(" ");
      if (words.length > 0) {
        setInput(input + words[0] + " ");
        setSuggestion(words.slice(1).join(" "));
      }
      return;
    }
    
    // Dismiss suggestion with Escape
    if (e.key === "Escape" && suggestion) {
      e.preventDefault();
      setSuggestion("");
      return;
    }

    // Original enter key behavior for submitting tasks
    if (e.key === "Enter" && input.trim()) {
      // Process the input text
      const dateCommand = processDateCommand(input.trim());
      
      if (dateCommand.isDateCommand && dateCommand.date) {
        onAddDate(dateCommand.date);
      } else {
        const markdownResult = processMarkdown(input.trim());
        
        if (markdownResult.isTask) {
          onAddTask(input.trim());
        } else {
          // For now, treat any non-command text as a task
          onAddTask(`[ ] ${input.trim()}`);
        }
      }
      
      // Play sound effect for adding a task
      if (!dateCommand.isDateCommand) {
        playTaskAddSound();
      }
      
      // Clear the input and suggestion
      setInput("");
      setSuggestion("");
    }
  };

  return (
    <div className="todo-input-container mt-6 mb-8 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add new task or type /DD-MM-YY to add a day"
          className="w-full border-none bg-transparent px-0 py-2 text-lg focus:outline-none focus:ring-0"
          autoComplete="off"
          aria-label="New task input"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-pulse">
            <Code className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Inline suggestion */}
        {suggestion && !isLoading && (
          <div 
            className="absolute left-0 top-0 px-0 py-2 text-lg opacity-50 pointer-events-none"
            style={{ 
              paddingLeft: `${input.length}ch`,
              whiteSpace: 'pre'
            }}
            aria-hidden="true"
          >
            {suggestion}
          </div>
        )}
        
        {/* Subtle hint about keyboard shortcuts */}
        <div className="absolute right-0 top-full pt-1 text-xs text-muted-foreground opacity-70">
          {suggestion && "Tab to complete • → for word • Esc to dismiss"}
        </div>
      </div>
    </div>
  );
};

export default TodoInput;
