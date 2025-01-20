import React from 'react';
import { Play, Pause, Trash2, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Crawler } from '../../types';

interface CrawlerCardProps {
  crawler: Crawler;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const CrawlerCard: React.FC<CrawlerCardProps> = ({
  crawler,
  onStart,
  onStop,
  onDelete,
  onEdit,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{crawler.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{crawler.url}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          crawler.status === 'running' ? 'bg-green-100 text-green-800' :
          crawler.status === 'error' ? 'bg-red-100 text-red-800' :
          crawler.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {crawler.status}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Last Run</p>
          <p className="font-medium">{crawler.lastRun || 'Never'}</p>
        </div>
        <div>
          <p className="text-gray-500">Schedule</p>
          <p className="font-medium">{crawler.schedule || 'Manual'}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {crawler.status === 'running' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStop(crawler.id)}
          >
            <Pause className="w-4 h-4 mr-1" />
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStart(crawler.id)}
          >
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(crawler.id)}
        >
          <Settings className="w-4 h-4 mr-1" />
          Configure
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(crawler.id)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  );
};
