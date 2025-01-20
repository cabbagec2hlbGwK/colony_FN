import React from 'react';
import { Hash, Tag, Layers, Database } from 'lucide-react';
import type { ParsedElements } from '../../types';

interface ElementStatsProps {
  elements: ParsedElements;
}

export const ElementStats: React.FC<ElementStatsProps> = ({ elements }) => {
  const stats = {
    ids: elements.ids.size,
    classes: elements.classes.size,
    tags: elements.tags.size,
    total: Array.from(elements.tags.values()).reduce((acc, curr) => acc + curr.count, 0),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center">
          <Hash className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Unique IDs</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{stats.ids}</p>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center">
          <Tag className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Unique Classes</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{stats.classes}</p>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center">
          <Layers className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Element Types</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{stats.tags}</p>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-orange-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Total Elements</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
      </div>
    </div>
  );
};
