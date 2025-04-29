
import { useState } from "react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CircleDot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PriorityIndicatorProps {
  priority: Task["priority"];
  onPriorityChange: (priority: Task["priority"]) => void;
}

const PriorityIndicator = ({ priority, onPriorityChange }: PriorityIndicatorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "text-priority-high hover:text-priority-high";
      case "medium":
        return "text-priority-medium hover:text-priority-medium";
      case "low":
        return "text-priority-low hover:text-priority-low";
      default:
        return "text-muted-foreground hover:text-muted-foreground";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full focus:outline-none",
            getPriorityColor()
          )}
          aria-label="Set priority"
        >
          <CircleDot className="h-3.5 w-3.5" />
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
          <span>None</span>
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
