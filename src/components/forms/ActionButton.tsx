import React from 'react';
import { 
  MousePointer, 
  Keyboard, 
  Download, 
  Clock, 
  MousePointer2 
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { ActionType } from '../../types';

interface ActionButtonProps {
  type: ActionType;
  onClick: () => void;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  type, 
  onClick, 
  disabled 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'click':
        return MousePointer;
      case 'type':
        return Keyboard;
      case 'extract':
        return Download;
      case 'wait':
        return Clock;
      case 'hover':
        return MousePointer2;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'click':
        return 'Click';
      case 'type':
        return 'Type Text';
      case 'extract':
        return 'Extract Data';
      case 'wait':
        return 'Wait';
      case 'hover':
        return 'Hover';
    }
  };

  const Icon = getIcon();

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center space-x-1"
    >
      <Icon className="w-4 h-4" />
      <span>{getLabel()}</span>
    </Button>
  );
};
