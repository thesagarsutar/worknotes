
import { useState, useEffect, useRef } from "react";
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
  const [rotation, setRotation] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const offsetX = useRef(mousePosition.x - initialPosition.x);
  const offsetY = useRef(mousePosition.y - initialPosition.y);

  // Apply a slight rotation effect when dragging starts
  useEffect(() => {
    // Small random rotation between -2 and 2 degrees for a natural feel
    setRotation(Math.random() * 4 - 2);
  }, []);

  useEffect(() => {
    // Directly follow the mouse cursor with a fixed offset for better visibility
    setPosition({ 
      left: mousePosition.x + 5, 
      top: mousePosition.y + 5
    });
  }, [mousePosition]);

  // Ensure the preview stays within viewport bounds
  useEffect(() => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = position.left;
    let newTop = position.top;
    
    // Adjust if off screen
    if (newLeft + rect.width > viewportWidth) {
      newLeft = viewportWidth - rect.width;
    }
    
    if (newTop + rect.height > viewportHeight) {
      newTop = viewportHeight - rect.height;
    }
    
    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    
    if (newLeft !== position.left || newTop !== position.top) {
      setPosition({ left: newLeft, top: newTop });
    }
  }, [position]);

  return (
    <div 
      ref={previewRef}
      className="fixed z-50 opacity-90 pointer-events-none bg-white dark:bg-gray-800 p-2 rounded-md shadow-xl w-[calc(100%-4rem)]"
      style={{
        left: position.left,
        top: position.top,
        maxWidth: "500px",
        transform: `rotate(${rotation}deg)`,
        transition: 'none', // Remove transition for smoother cursor following
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        border: '1px solid rgba(14, 165, 233, 0.5)'
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
