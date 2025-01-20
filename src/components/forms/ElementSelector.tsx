import React, { useState, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';
import type { PageElements, SelectedElement, RawElement } from '../../types';
import { ElementSummary } from './ElementSummary';

interface ElementSelectorProps {
  elements: PageElements;
  selectedElements: SelectedElement[];
  onElementSelect: (element: SelectedElement) => void;
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({ 
  elements,
  selectedElements,
  onElementSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'id' | 'class' | 'tag'>('id');
  const [selectedFilter, setSelectedFilter] = useState<SelectedElement | null>(null);

  const filteredElements = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const currentElements = elements[selectedTab];
    
    return currentElements.filter(element => 
      element.selector.toLowerCase().includes(term) ||
      element.example.toLowerCase().includes(term)
    );
  }, [elements, selectedTab, searchTerm]);

  const isSelected = (selector: string, type: 'id' | 'class' | 'tag') => {
    return selectedElements.some(e => e.selector === selector && e.type === type);
  };

  const handleElementClick = (element: ElementInfo) => {
    const selectedElement = {
      selector: element.selector,
      type: selectedTab,
      count: element.count
    };

    // If clicking the same element that's currently filtered, clear the filter
    if (selectedFilter?.selector === element.selector && selectedFilter?.type === selectedTab) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(selectedElement);
    }

    onElementSelect(selectedElement);
  };

  return (
    <div className="space-y-4">
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
                selectedTab === 'id'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('id')}
            >
              IDs ({elements.id.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                selectedTab === 'class'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('class')}
            >
              Classes ({elements.class.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                selectedTab === 'tag'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('tag')}
            >
              Tags ({elements.tag.length})
            </button>
          </nav>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredElements.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No elements found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredElements.map((element, index) => {
                const selected = isSelected(element.selector, selectedTab);
                const isFiltered = selectedFilter?.selector === element.selector && 
                                 selectedFilter?.type === selectedTab;
                
                return (
                  <div
                    key={`${element.selector}-${index}`}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selected ? 'bg-blue-50' : ''
                    } ${isFiltered ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleElementClick(element)}
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
                            {element.selector}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                          Count: {element.count}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 ml-7">
                      <p className="text-xs text-gray-500">Example:</p>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {element.example}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedFilter && (
        <ElementSummary
          filter={selectedFilter}
          onClose={() => setSelectedFilter(null)}
        />
      )}
    </div>
  );
};
