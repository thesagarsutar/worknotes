
import { KeyboardEvent, useState } from "react";
import { processDateCommand } from "@/lib/utils";

interface TodoInputProps {
  onAddTask: (task: string) => void;
  onAddDate: (date: string) => void;
}

const TodoInput = ({ onAddTask, onAddDate }: TodoInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const { isDateCommand, date } = processDateCommand(inputValue.trim());
      
      if (isDateCommand && date) {
        onAddDate(date);
      } else {
        onAddTask(inputValue.trim());
      }
      
      setInputValue("");
    }
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Add new task or type /DD-MM-YY to add a day"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
      />
    </div>
  );
};

export default TodoInput;
