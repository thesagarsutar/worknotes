import { useState, useEffect, useRef } from "react";

// Utility to render URLs as clickable links in task content
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

function renderTextWithLinks(text: string, onEditLink: () => void): React.ReactNode {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  text.replace(urlRegex, (url, _group, _prefix, offset) => {
    // Push preceding text
    if (lastIndex < offset) {
      elements.push(text.slice(lastIndex, offset));
    }
    let href = url;
    if (!href.startsWith("http://") && !href.startsWith("https://")) {
      href = "https://" + href;
    }
    elements.push(
      <Tooltip key={offset}>
        <TooltipTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#5a9fff', textDecoration: 'none', wordBreak: 'break-all' }}
            tabIndex={0} // for accessibility
          >
            {url}
          </a>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          <span
            style={{ display: 'inline-block' }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onEditLink();
            }}
          >
            Edit
          </span>
        </TooltipContent>
      </Tooltip>
    );
    lastIndex = offset + url.length;
    return url;
  });

  // Push any remaining text after the last URL
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  return elements;
}


import TaskCheckbox from "./TaskCheckbox";
import PriorityIndicator from "./PriorityIndicator";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { Task, TasksByDate } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import DragPreview from "./DragPreview";
import { useSuggestions } from "@/hooks/useSuggestions";
import { getCaretCoordinates } from "@/lib/textarea-caret-position";

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
  tasksByDate?: TasksByDate; // Added for suggestions
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
  onDrop,
  tasksByDate
}: TaskItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [showDragHandle, setShowDragHandle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showEditFeedback, setShowEditFeedback] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [caretCoordinates, setCaretCoordinates] = useState({ top: 8, left: 0, height: 24 });
  
  // Use suggestions hook for autocomplete
  const { 
    inputText, 
    setInputText, 
    suggestion, 
    suggestionWords,
    isLoading,
    aiEnabled,
    clearSuggestion
  } = useSuggestions(tasksByDate);
  
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task.isCompleted) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [task.isCompleted]);

  useEffect(() => {
    if (showEditFeedback) {
      const timer = setTimeout(() => setShowEditFeedback(false), 1000); // Changed to 1 second
      return () => clearTimeout(timer);
    }
  }, [showEditFeedback]);

  // Only focus and set cursor when entering editing mode (not on every editContent change)
useEffect(() => {
  if (isEditing && editInputRef.current) {
    editInputRef.current.focus();
    // Set cursor at the end of text only when starting to edit
    const length = editInputRef.current.value.length;
    editInputRef.current.selectionStart = length;
    editInputRef.current.selectionEnd = length;
    setCursorPosition(length);
    setInputText(editContent);
    const coordinates = getCaretCoordinates(editInputRef.current, length);
    setCaretCoordinates(coordinates);
    adjustTextareaHeight(editInputRef.current);
  } else {
    clearSuggestion();
  }
  // Only run when isEditing changes, NOT on every editContent change
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isEditing, clearSuggestion]);

  useEffect(() => {
    // Add mouse move listener when dragging
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUpDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUpDragEnd);
    };
  }, [isDragging]);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUpDragEnd = () => {
    setIsDragging(false);
    
    // Reset opacity
    if (taskRef.current) {
      taskRef.current.style.opacity = '1';
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditContent(task.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Accept suggestion with Tab key
    if (e.key === 'Tab' && suggestion && cursorPosition === editContent.length && !e.shiftKey) {
      e.preventDefault();
      
      // Get the last word being typed
      const lastSpaceIndex = editContent.lastIndexOf(' ');
      const textBeforeLastWord = lastSpaceIndex >= 0 ? editContent.substring(0, lastSpaceIndex + 1) : '';
      const lastWord = lastSpaceIndex >= 0 ? editContent.substring(lastSpaceIndex + 1) : editContent;
      
      // Complete the current word only and add a space after it
      const completedWord = lastWord + suggestion;
      const newText = textBeforeLastWord + completedWord + ' ';
      
      setEditContent(newText);
      setInputText(newText);
      
      // Clear the current suggestion
      clearSuggestion();
      
      // Adjust textarea height for the new content
      if (editInputRef.current) {
        adjustTextareaHeight(editInputRef.current);
      }
      
      return;
    }
    
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
      // Only show feedback if content actually changed
      if (trimmedContent !== task.content) {
        onTaskUpdate(task.id, trimmedContent);
        // Show edit feedback animation
        setShowEditFeedback(true);
      } else {
        // No change, just update without feedback
        onTaskUpdate(task.id, trimmedContent);
      }
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
    // Override any global styles that might affect height
    textarea.style.minHeight = 'unset';
    textarea.style.boxSizing = 'border-box';
    
    // Get the current text content
    const content = textarea.value;
    
    // Measure if this would be a single line based on the container width
    // First, get the available width for text
    const availableWidth = textarea.clientWidth;
    
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap'; // Prevent wrapping
    tempSpan.style.font = window.getComputedStyle(textarea).font;
    tempSpan.innerText = textarea.value;
    document.body.appendChild(tempSpan);
    
    // Get the width of the text if it were on a single line
    const textWidth = tempSpan.offsetWidth;
    
    // Remove the temporary element
    document.body.removeChild(tempSpan);
    
    // If the text width is less than or equal to the available width,
    // it can fit on a single line
    if (textWidth <= availableWidth && !textarea.value.includes('\n')) {
      textarea.style.height = '24px';
    } else {
      // For multi-line content, use scrollHeight
      textarea.style.height = 'auto'; // Reset height
      const newHeight = Math.max(textarea.scrollHeight, 24);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    setInputText(e.target.value); // Update input text for suggestions
    adjustTextareaHeight(e.target);
    
    // Update cursor position and caret coordinates for suggestion positioning
    if (e.target) {
      const position = e.target.selectionStart;
      setCursorPosition(position);
      
      // Get caret coordinates for suggestion positioning
      const coordinates = getCaretCoordinates(e.target, position);
      setCaretCoordinates(coordinates);
    }
  };

  const handleCustomDragStart = (e: React.DragEvent) => {
    if (taskRef.current) {
      // Get position for preview
      const rect = taskRef.current.getBoundingClientRect();
      setDragPreviewPosition({ x: rect.left, y: rect.top });
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
    
    setIsDragging(true);
    
    // Make task look faded while dragging
    if (taskRef.current) {
      taskRef.current.style.opacity = '0.5';
    }
    
    // Set data transfer
    onDragStart(e, task.id, task.date, index);
    
    // Create a completely empty image to hide the default drag image and the globe icon
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent pixel
    e.dataTransfer.setDragImage(img, 0, 0);
    
    // Prevent default browser drag behavior
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Reset opacity
    if (taskRef.current) {
      taskRef.current.style.opacity = '1';
    }
  };

  return (
    <>
      <div
        ref={taskRef}
        className={cn(
          "task-item group relative py-1",
          "transition-all duration-200",
          "before:hidden before:h-[2px] before:w-full before:bg-[#0EA5E9] before:absolute before:left-0 before:-top-[1px]",
          "after:hidden after:h-[2px] after:w-full after:bg-[#0EA5E9] after:absolute after:left-0 after:bottom-[-1px]",
          task.isCompleted && "completed",
          isAnimating && "animate-fade-in",
          isDragging && "opacity-50",
          showEditFeedback && "bg-blue-500 bg-opacity-20", // Rich blue background with 20% opacity for edit feedback
          "drag-over:before:block drag-over:after:block"
        )}
        onMouseEnter={() => setShowDragHandle(true)}
        onMouseLeave={() => setShowDragHandle(false)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, task.date, index)}
        draggable={showDragHandle}
        onDragStart={handleCustomDragStart}
        onDragEnd={handleDragEnd}
        aria-grabbed={isDragging}
        aria-label={`Task: ${task.content}`}
        data-task-id={task.id}
      >
        <div className="flex items-start gap-2 w-full">
          <div
            className={cn(
              "w-6 h-6 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
              showDragHandle ? "visible" : "invisible"
            )}
            aria-label="Drag to reorder"
            role="button"
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
            <div className="flex-1 min-w-0 w-full relative">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="w-full resize-none bg-transparent outline-none p-0 overflow-hidden task-edit-textarea"
                style={{ 
                  minHeight: 'unset', // Override any default minimum height
                  height: !editContent.includes('\n') ? '24px' : 'auto', // Set fixed height for single line
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
              
              {/* Word-based suggestion overlay positioned at caret */}
              {suggestion && cursorPosition === editContent.length && editContent.trim().length > 0 && (
                <div 
                  className="absolute pointer-events-none text-muted-foreground/40"
                  style={{
                    fontSize: 'inherit',
                    top: `${caretCoordinates.top - 1.5}px`, // Move up by 2px
                    left: `${caretCoordinates.left}px`,
                    maxWidth: 'calc(100% - 16px)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {suggestion}
                </div>
              )}
            </div>
          ) : (
            <div 
              className={cn("task-content flex-1 min-w-0 break-words w-full p-0 cursor-pointer", task.isCompleted && "completed")}
              onClick={handleDoubleClick}
              style={{
                width: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                minHeight: '24px'
              }}
            >
              {renderTextWithLinks(task.content, () => setIsEditing(true))}
            </div>
          )}
        </div>
      </div>
      
      {/* Drag preview element */}
      {isDragging && (
        <DragPreview 
          task={task} 
          initialPosition={dragPreviewPosition}
          mousePosition={mousePosition}
        />
      )}
    </>
  );
};

export default TaskItem;
