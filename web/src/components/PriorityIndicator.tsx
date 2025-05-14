
import { useState } from "react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleDot } from "lucide-react";

interface PriorityIndicatorProps {
  priority: Task["priority"];
  onPriorityChange: (priority: Task["priority"]) => void;
}

const PriorityIndicator = ({ priority, onPriorityChange }: PriorityIndicatorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "bg-priority-high";
      case "medium":
        return "bg-priority-medium";
      case "low":
        return "bg-priority-low";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center focus:outline-none px-1.5"
          aria-label="Set priority"
        >
          <div 
            className={cn(
              "w-[3px] h-4 rounded-sm",
              getPriorityColor()
            )}
          ></div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => onPriorityChange("high")}
        >
          <CircleDot className="h-3.5 w-3.5 text-priority-high" />
          <span>High</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => onPriorityChange("medium")}
        >
          <CircleDot className="h-3.5 w-3.5 text-priority-medium" />
          <span>Medium</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => onPriorityChange("low")}
        >
          <CircleDot className="h-3.5 w-3.5 text-priority-low" />
          <span>Low</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => onPriorityChange("none")}
        >
          <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
          <span>None</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PriorityIndicator;
