
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
        className="w-full py-2 focus:outline-none border-none bg-transparent dark:bg-transparent"
      />
    </div>
  );
};

export default TodoInput;
