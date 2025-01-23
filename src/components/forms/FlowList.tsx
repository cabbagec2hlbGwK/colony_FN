import React from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import type { Flow } from '../../types';
import { Button } from '../ui/Button';

interface FlowListProps {
  flows: Flow[];
  currentFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
  onDeleteFlow: (flowId: string) => void;
  onCreateFlow: () => void;
}

export const FlowList: React.FC<FlowListProps> = ({
  flows,
  currentFlowId,
  onSelectFlow,
  onDeleteFlow,
  onCreateFlow,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Flows</h3>
        <Button size="sm" onClick={onCreateFlow}>
          New Flow
        </Button>
      </div>

      <div className="space-y-2">
        <div
          className={`p-2 rounded-lg cursor-pointer ${
            currentFlowId === null ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectFlow(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              <span>Initial URL Analysis</span>
            </div>
          </div>
        </div>

        {flows.map((flow) => (
          <div
            key={flow.id}
            className={`p-2 rounded-lg cursor-pointer ${
              currentFlowId === flow.id ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectFlow(flow.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span>{flow.name}</span>
                <span className="text-sm text-gray-500">
                  ({flow.tasks.length} {flow.tasks.length === 1 ? 'task' : 'tasks'})
                </span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFlow(flow.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
