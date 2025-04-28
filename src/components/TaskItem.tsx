import { useState, useEffect, useRef } from "react";
import TaskCheckbox from "./TaskCheckbox";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2 } from "lucide-react";
import { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
  onTaskDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string, fromDate: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toDate: string) => void;
}

const TaskItem = ({ 
  task, 
  onStatusChange, 
  onTaskUpdate,
  onTaskDelete,
  onDragStart,
  onDragOver,
  onDrop
}: TaskItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [showDragHandle, setShowDragHandle] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task.isCompleted) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [task.isCompleted]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditContent(task.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const saveEdit = () => {
    const trimmedContent = editContent.trim();
    if (trimmedContent === '') {
      onTaskDelete(task.id);
    } else {
      onTaskUpdate(task.id, trimmedContent);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(task.content);
  };

  return (
    <div
      className={cn(
        "task-item group",
        task.isCompleted && "completed",
        isAnimating && "animate-fade-in"
      )}
      onMouseEnter={() => setShowDragHandle(true)}
      onMouseLeave={() => setShowDragHandle(false)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, task.date)}
    >
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id, task.date)}
        className={cn(
          "w-6 h-6 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity",
          showDragHandle ? "visible" : "invisible"
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <TaskCheckbox 
        isCompleted={task.isCompleted} 
        onChange={() => onStatusChange(task.id, !task.isCompleted)} 
      />
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="flex-1 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
        />
      ) : (
        <div 
          className={cn("task-content", task.isCompleted && "completed")}
          onDoubleClick={handleDoubleClick}
        >
          {task.content}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
