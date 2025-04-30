
import { DateSection } from "./DateSection";
import { useTaskContext } from "@/contexts/TaskContext";

const TaskList = () => {
  const { tasksByDate, onTaskStatusChange, onTaskUpdate, onTaskDelete, onTaskPriorityChange, onTaskMove, onTaskReorder } = useTaskContext();

  // Get sorted dates for the sections, from newest to oldest
  const sortedDates = Object.keys(tasksByDate).sort().reverse();

  return (
    <>
      {sortedDates.map(date => (
        <DateSection
          key={date}
          date={date}
          tasks={tasksByDate[date]}
          onTaskStatusChange={onTaskStatusChange}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          onTaskPriorityChange={onTaskPriorityChange}
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      ))}
    </>
  );
};

export default TaskList;
