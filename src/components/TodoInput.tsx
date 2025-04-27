
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { processMarkdown, processDateCommand } from "@/lib/utils";

interface TodoInputProps {
  onAddTask: (content: string) => void;
  onAddDate: (date: string) => void;
}

const TodoInput = ({ onAddTask, onAddDate }: TodoInputProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
      
      // Clear the input
      setInput("");
    }
  };

  return (
    <div className="todo-input-container mt-6 mb-8">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type [] for a new task, [x] for completed, /today or /date YYYY-MM-DD..."
        className="w-full border-none bg-transparent px-0 py-2 text-lg focus:outline-none focus:ring-0"
        autoComplete="off"
        aria-label="New task input"
      />
    </div>
  );
};

export default TodoInput;
