
import { TaskProvider } from "@/contexts/TaskContext";
import TodoInput from "./TodoInput";
import ThemeToggle from "./ThemeToggle";
import DateIndex from "./DateIndex";
import TaskList from "./TaskList";
import { useTaskContext } from "@/contexts/TaskContext";

// A component to render the DateIndex and other content that depends on taskContext
const TodoContent = () => {
  const { tasksByDate, onAddTask, onAddDate, onDateClick } = useTaskContext();
  
  // Get sorted dates for the DateIndex component
  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <>
      <ThemeToggle />
      <TodoInput onAddTask={onAddTask} onAddDate={onAddDate} />
      {sortedDates.length > 0 && (
        <DateIndex dates={sortedDates} onDateClick={onDateClick} />
      )}
      <TaskList />
    </>
  );
};

// Main component that wraps everything in the TaskProvider
const TodoPage = () => {
  return (
    <div className="editor-container relative">
      <TaskProvider>
        <TodoContent />
      </TaskProvider>
    </div>
  );
};

export default TodoPage;
