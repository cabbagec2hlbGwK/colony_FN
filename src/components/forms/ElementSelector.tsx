import React, { useState, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';
import type { ParsedElements, SelectedElement } from '../../types';

interface ElementSelectorProps {
  elements: ParsedElements;
  selectedElements: SelectedElement[];
  onElementSelect: (element: SelectedElement) => void;
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({ 
  elements,
  selectedElements,
  onElementSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ids' | 'classes' | 'tags'>('ids');

  const filteredElements = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const currentMap = elements[selectedTab];
    
    return Array.from(currentMap.entries())
      .filter(([key, info]) => 
        key.toLowerCase().includes(term) ||
        info.examples.some(ex => ex.tag.toLowerCase().includes(term))
      )
      .sort((a, b) => b[1].count - a[1].count);
  }, [elements, selectedTab, searchTerm]);

  const isSelected = (selector: string, type: 'id' | 'class' | 'tag') => {
    return selectedElements.some(e => e.selector === selector && e.type === type);
  };

  const handleElementSelect = (key: string, count: number) => {
    const element: SelectedElement = {
      selector: selectedTab === 'ids' ? `#${key}` : 
               selectedTab === 'classes' ? `.${key}` : key,
      type: selectedTab === 'ids' ? 'id' : 
            selectedTab === 'classes' ? 'class' : 'tag',
      count
    };
    onElementSelect(element);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search elements..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'ids'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('ids')}
          >
            IDs ({elements.ids.size})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'classes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('classes')}
          >
            Classes ({elements.classes.size})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'tags'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('tags')}
          >
            Tags ({elements.tags.size})
          </button>
        </nav>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredElements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No elements found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredElements.map(([key, info]) => {
              const selector = selectedTab === 'ids' ? `#${key}` : 
                             selectedTab === 'classes' ? `.${key}` : key;
              const type = selectedTab === 'ids' ? 'id' : 
                          selectedTab === 'classes' ? 'class' : 'tag';
              const selected = isSelected(selector, type);
              
              return (
                <div
                  key={key}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleElementSelect(key, info.count)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded border mr-2 flex items-center justify-center ${
                          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {selector}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 ml-7">
                        Found in {info.count} {info.count === 1 ? 'element' : 'elements'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 ml-7">
                    <p className="text-xs text-gray-500">Examples:</p>
                    <div className="space-y-1 mt-1">
                      {info.examples.slice(0, 2).map((example, i) => (
                        <pre key={i} className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {`<${example.tag}${example.id ? ` id="${example.id}"` : ''}${
                            example.class ? ` class="${example.class.join(' ')}"` : ''
                          }>${example.tag === 'img' ? '' : '...'}</${example.tag}>`}
                        </pre>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
