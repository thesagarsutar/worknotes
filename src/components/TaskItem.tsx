
import { useState, useEffect, useRef } from "react";
import TaskCheckbox from "./TaskCheckbox";
import PriorityIndicator from "./PriorityIndicator";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { Task } from "@/lib/types";
import { Textarea } from "./ui/textarea";

interface TaskItemProps {
  task: Task;
  index: number;
  onStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
  onTaskDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Task["priority"]) => void;
  onDragStart: (e: React.DragEvent, taskId: string, fromDate: string, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toDate: string, toIndex: number) => void;
}

const TaskItem = ({
  task,
  index,
  onStatusChange,
  onTaskUpdate,
  onTaskDelete,
  onPriorityChange,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}: TaskItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [showDragHandle, setShowDragHandle] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

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
      
      // Set cursor at the end of text
      const length = editInputRef.current.value.length;
      editInputRef.current.selectionStart = length;
      editInputRef.current.selectionEnd = length;
      
      // Adjust height to match content
      adjustTextareaHeight(editInputRef.current);
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditContent(task.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  const handlePriorityChange = (priority: Task["priority"]) => {
    onPriorityChange(task.id, priority);
  };
  
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to match the content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    adjustTextareaHeight(e.target);
  };

  return (
    <div
      className={cn(
        "task-item group relative py-1",
        "before:hidden before:h-[2px] before:w-full before:bg-[#0EA5E9] before:absolute before:left-0 before:-top-[1px]",
        "after:hidden after:h-[2px] after:w-full after:bg-[#0EA5E9] after:absolute after:left-0 after:bottom-[-1px]",
        task.isCompleted && "completed",
        isAnimating && "animate-fade-in",
        "drag-over:before:block drag-over:after:block"
      )}
      onMouseEnter={() => setShowDragHandle(true)}
      onMouseLeave={() => setShowDragHandle(false)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, task.date, index)}
      draggable={showDragHandle}
      onDragStart={(e) => onDragStart(e, task.id, task.date, index)}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "w-6 h-6 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
            showDragHandle ? "visible" : "invisible"
          )}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center">
          <PriorityIndicator 
            priority={task.priority} 
            onPriorityChange={handlePriorityChange} 
          />
          <TaskCheckbox 
            isCompleted={task.isCompleted} 
            onChange={() => onStatusChange(task.id, !task.isCompleted)} 
          />
        </div>
        {isEditing ? (
          <div className="flex-1 min-w-0 w-full">
            <Textarea
              ref={editInputRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="min-h-0 w-full p-0 border-none bg-transparent focus:ring-0 resize-none overflow-hidden"
              style={{ height: 'auto' }}
            />
          </div>
        ) : (
          <div 
            className={cn("task-content flex-1 min-w-0 break-words", task.isCompleted && "completed")}
            onDoubleClick={handleDoubleClick}
          >
            {task.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
