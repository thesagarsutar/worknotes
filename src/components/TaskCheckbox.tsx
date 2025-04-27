
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCheckboxProps {
  isCompleted: boolean;
  onChange: (isCompleted: boolean) => void;
  className?: string;
}

const TaskCheckbox = ({ isCompleted, onChange, className }: TaskCheckboxProps) => {
  return (
    <div
      className={cn(
        "task-checkbox",
        isCompleted && "checked",
        className
      )}
      role="checkbox"
      aria-checked={isCompleted}
      tabIndex={0}
      onClick={() => onChange(!isCompleted)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!isCompleted);
        }
      }}
    >
      {isCompleted && (
        <div className="task-checkbox-icon animate-check-mark">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};

export default TaskCheckbox;
