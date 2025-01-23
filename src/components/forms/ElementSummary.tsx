import React from 'react';
import type { RawElement, TaskAction } from '../../types';
import { ActionButton } from './ActionButton';
import { Button } from '../ui/Button';

interface ElementSummaryProps {
  elements: RawElement[];
  onAddAction?: (action: TaskAction) => void;
}

export const ElementSummary: React.FC<ElementSummaryProps> = ({ 
  elements,
  onAddAction 
}) => {
  const [selectedElement, setSelectedElement] = React.useState<RawElement | null>(null);
  const [showTypeInput, setShowTypeInput] = React.useState(false);
  const [typeValue, setTypeValue] = React.useState('');

  const handleActionClick = (type: TaskAction['type']) => {
    if (!selectedElement || !onAddAction) return;

    let selector: string;
    let selectorType: 'id' | 'class' | 'tag';

    if (selectedElement.id) {
      selector = `#${selectedElement.id}`;
      selectorType = 'id';
    } else if (selectedElement.class && selectedElement.class.length > 0) {
      selector = `.${selectedElement.class[0]}`;
      selectorType = 'class';
    } else {
      selector = selectedElement.tag;
      selectorType = 'tag';
    }

    const action: TaskAction = {
      type,
      selector,
      selectorType,
      description: `${type} ${selector}${type === 'type' ? ` with "${typeValue}"` : ''}`
    };

    if (type === 'type') {
      action.value = typeValue;
    }

    onAddAction(action);
    setShowTypeInput(false);
    setTypeValue('');
  };

  // Group elements by their structure
  const elementGroups = React.useMemo(() => {
    const groups = new Map<string, { element: RawElement; count: number }>();
    
    elements.forEach(element => {
      const key = JSON.stringify({
        tag: element.tag,
        hasId: !!element.id,
        hasClass: !!element.class?.length,
        hasName: !!element.name
      });
      
      if (groups.has(key)) {
        groups.get(key)!.count++;
      } else {
        groups.set(key, { element, count: 1 });
      }
    });
    
    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count);
  }, [elements]);

  if (elements.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No matching elements found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {elementGroups.map(({ element, count }, index) => (
        <div 
          key={index} 
          className={`border border-gray-200 rounded-md p-3 ${
            selectedElement === element ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedElement(element)}
        >
          <div className="flex justify-between items-start mb-2">
            <code className="text-sm bg-gray-50 px-2 py-1 rounded">
              {element.tag}
            </code>
            <span className="text-sm text-gray-500">
              {count} {count === 1 ? 'instance' : 'instances'}
            </span>
          </div>
          
          {(element.id || element.class || element.name) && (
            <div className="text-sm space-y-1">
              {element.id && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">ID:</span>
                  <code className="bg-gray-50 px-1 rounded">{element.id}</code>
                </div>
              )}
              {element.class && element.class.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Classes:</span>
                  <code className="bg-gray-50 px-1 rounded">
                    {element.class.join(' ')}
                  </code>
                </div>
              )}
              {element.name && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Name:</span>
                  <code className="bg-gray-50 px-1 rounded">{element.name}</code>
                </div>
              )}
            </div>
          )}

          {count === 1 && selectedElement === element && onAddAction && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <ActionButton 
                  type="click" 
                  onClick={() => handleActionClick('click')} 
                />
                <ActionButton 
                  type="type" 
                  onClick={() => setShowTypeInput(true)} 
                />
                <ActionButton 
                  type="extract" 
                  onClick={() => handleActionClick('extract')} 
                />
                <ActionButton 
                  type="hover" 
                  onClick={() => handleActionClick('hover')} 
                />
                <ActionButton 
                  type="wait" 
                  onClick={() => handleActionClick('wait')} 
                />
              </div>

              {showTypeInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={typeValue}
                    onChange={(e) => setTypeValue(e.target.value)}
                    placeholder="Enter text to type..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleActionClick('type')}
                    disabled={!typeValue}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowTypeInput(false);
                      setTypeValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
