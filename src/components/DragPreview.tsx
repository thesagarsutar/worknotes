
import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import TaskCheckbox from "./TaskCheckbox";
import PriorityIndicator from "./PriorityIndicator";
import { cn } from "@/lib/utils";

interface DragPreviewProps {
  task: Task;
  initialPosition: { x: number; y: number };
  mousePosition: { x: number; y: number };
}

const DragPreview = ({ task, initialPosition, mousePosition }: DragPreviewProps) => {
  const [position, setPosition] = useState({ 
    left: initialPosition.x, 
    top: initialPosition.y 
  });
  
  // Calculate offset between initial mouse position and element position
  const [offset] = useState({
    x: initialPosition.x - mousePosition.x,
    y: initialPosition.y - mousePosition.y
  });

  useEffect(() => {
    // Use the stored offset to position the element relative to the mouse
    setPosition({ 
      left: mousePosition.x + offset.x, 
      top: mousePosition.y + offset.y
    });
  }, [mousePosition, offset]);

  return (
    <div 
      className="fixed z-50 opacity-70 pointer-events-none bg-white dark:bg-gray-800 p-2 rounded shadow-md w-[calc(100%-3rem)]"
      style={{
        left: position.left,
        top: position.top,
        maxWidth: "500px",
        transform: "translate(8px, 8px)" // Small offset to see original underneath
      }}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 flex items-center justify-center opacity-0">
          {/* Placeholder for drag handle */}
        </div>
        <div className="flex items-center">
          <PriorityIndicator 
            priority={task.priority} 
            onPriorityChange={() => {}} 
          />
          <TaskCheckbox 
            isCompleted={task.isCompleted} 
            onChange={() => {}} 
          />
        </div>
        <div 
          className={cn("task-content flex-1 min-w-0 break-words", task.isCompleted && "completed")}
        >
          {task.content}
        </div>
      </div>
    </div>
  );
};

export default DragPreview;
