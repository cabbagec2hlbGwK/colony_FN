import React from 'react';
import { Trash2, GripVertical, ArrowDown } from 'lucide-react';
import type { CrawlerTask } from '../../types';
import { Button } from '../ui/Button';

interface TaskListProps {
  tasks: CrawlerTask[];
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (startIndex: number, endIndex: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onDeleteTask,
  onReorderTasks,
}) => {
  const [draggedTask, setDraggedTask] = React.useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;

    const startIndex = tasks.findIndex(t => t.id === draggedTask);
    const endIndex = tasks.findIndex(t => t.id === targetTaskId);
    
    onReorderTasks(startIndex, endIndex);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="bg-white rounded-lg border border-gray-200 p-3"
          draggable
          onDragStart={() => handleDragStart(task.id)}
          onDragOver={(e) => handleDragOver(e, task.id)}
        >
          <div className="flex items-center space-x-3">
            <div className="cursor-move">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1">
              {task.actions.map((action, actionIndex) => (
                <div key={actionIndex} className="flex items-center">
                  <span className="text-sm">
                    {action.description}
                  </span>
                  {actionIndex < task.actions.length - 1 && (
                    <ArrowDown className="w-4 h-4 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
