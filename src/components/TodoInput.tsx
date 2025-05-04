
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { processMarkdown, processDateCommand } from "@/lib/utils";
import { Editor, EditorRoot, EditorContent, EditorCommand, CommandList, CommandItem } from "novel";
import { defaultEditorProps } from "novel/editor";

interface TodoInputProps {
  onAddTask: (content: string) => void;
  onAddDate: (date: string) => void;
}

const TodoInput = ({ onAddTask, onAddDate }: TodoInputProps) => {
  const [input, setInput] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      
      // Process the input text
      const dateCommand = processDateCommand(input.trim());
      
      if (dateCommand.isDateCommand && dateCommand.date) {
        onAddDate(dateCommand.date);
      } else {
        const markdownResult = processMarkdown(input.trim());
        
        if (markdownResult.isTask) {
          onAddTask(input.trim());
        } else {
          // For now, treat any non-command text as a task
          onAddTask(`[ ] ${input.trim()}`);
        }
      }
      
      // Clear the input
      setInput("");
      
      // Clear editor content
      if (editorRef.current) {
        const editorDiv = editorRef.current.querySelector('[contenteditable="true"]');
        if (editorDiv) {
          editorDiv.textContent = '';
        }
      }
    }
  };

  // Commands list for the editor
  const commands = [
    {
      name: "Add Date",
      description: "Add a new date section",
      command: ({ editor, range }) => {
        return {
          run: () => {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            
            editor
              .chain()
              .deleteRange(range)
              .insertContent(`/${day}-${month}-${year}`)
              .run();
              
            return true;
          }
        };
      },
    },
  ];

  return (
    <div className="todo-input-container mt-6 mb-8" ref={editorRef}>
      <EditorRoot>
        <EditorContent
          placeholder="Add new task or type /DD-MM-YY to add a day"
          className="w-full border-none bg-transparent px-0 py-2 text-lg focus:outline-none focus:ring-0"
          aria-label="New task input"
          onKeyDown={handleKeyDown}
          onChange={(value) => setInput(value.getText())}
          extensions={defaultEditorProps.extensions}
          editorProps={{
            ...defaultEditorProps,
            attributes: {
              class: "prose dark:prose-invert focus:outline-none max-w-full",
            },
            handleKeyDown: (view, event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleKeyDown(event as unknown as KeyboardEvent);
                return true;
              }
              return false;
            }
          }}
        />
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <CommandList className="pointer-events-auto overflow-y-auto">
            {commands.map((command, index) => (
              <CommandItem
                key={index}
                className="aria-selected:bg-accent flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
                onCommand={() => {}}
                commandName={command.name}
              >
                <span>{command.name}</span>
                <span className="text-muted-foreground text-xs">{command.description}</span>
              </CommandItem>
            ))}
          </CommandList>
        </EditorCommand>
      </EditorRoot>
    </div>
  );
};

export default TodoInput;
