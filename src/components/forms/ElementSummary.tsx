import React, { useState, useEffect } from 'react';
import { 
  MousePointer, 
  Keyboard, 
  Download, 
  Clock, 
  MousePointer2,
  ChevronRight,
  ChevronDown,
  Copy,
  Code
} from 'lucide-react';
import type { RawElement, TaskAction } from '../../types';
import { ActionButton } from './ActionButton';
import { Button } from '../ui/Button';

interface ElementSummaryProps {
  elements: RawElement[];
  onAddAction?: (action: TaskAction) => void;
  isReadOnly?: boolean;
  maxHeight?: string;
  showMetadata?: boolean;
}

export const ElementSummary: React.FC<ElementSummaryProps> = ({ 
  elements,
  onAddAction,
  isReadOnly = false,
  maxHeight = 'max-h-96',
  showMetadata = false
}) => {
  const [selectedElement, setSelectedElement] = useState<RawElement | null>(null);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typeValue, setTypeValue] = useState('');
  const [expandedElements, setExpandedElements] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Add debug logging
  useEffect(() => {
    console.log('ElementSummary received elements:', elements);
  }, [elements]);

  const handleActionClick = (type: TaskAction['type']) => {
    if (!selectedElement || !onAddAction) return;

    let selector: string;
    let selectorType: 'id' | 'class' | 'tag';

    // Prioritize selectors: id > name > class > tag
    if (selectedElement.id) {
      selector = `#${selectedElement.id}`;
      selectorType = 'id';
    } else if (selectedElement.name) {
      selector = `[name="${selectedElement.name}"]`;
      selectorType = 'tag';
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
      value: type === 'type' ? typeValue : undefined,
      description: `${type} ${selector}${type === 'type' ? ` with "${typeValue}"` : ''}`
    };

    onAddAction(action);
    setShowTypeInput(false);
    setTypeValue('');
    setSelectedElement(null);
  };

  const toggleElementExpansion = (index: number) => {
    setExpandedElements(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyElementToClipboard = async (element: RawElement, index: number) => {
    const elementString = `<${element.tag}${element.id ? ` id="${element.id}"` : ''}${
      element.class ? ` class="${element.class.join(' ')}"` : ''
    }${element.name ? ` name="${element.name}"` : ''}${
      Object.entries(element.attributes || {})
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('')
    }>${element.innerText || ''}${element.tag === 'img' ? '' : `</${element.tag}>`}`;

    try {
      await navigator.clipboard.writeText(elementString);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const renderElementAttributes = (element: RawElement) => {
    return (
      <div className="space-y-2 ml-4">
        {element.id && (
          <div className="flex items-center">
            <span className="text-gray-500 w-16 text-sm">ID:</span>
            <code className="bg-gray-50 px-2 py-0.5 rounded text-sm">{element.id}</code>
          </div>
        )}
        
        {element.class && element.class.length > 0 && (
          <div className="flex items-start">
            <span className="text-gray-500 w-16 text-sm">Classes:</span>
            <div className="flex flex-wrap gap-1">
              {element.class.map((cls, index) => (
                <code key={index} className="bg-gray-50 px-2 py-0.5 rounded text-sm">
                  {cls}
                </code>
              ))}
            </div>
          </div>
        )}
        
        {element.name && (
          <div className="flex items-center">
            <span className="text-gray-500 w-16 text-sm">Name:</span>
            <code className="bg-gray-50 px-2 py-0.5 rounded text-sm">{element.name}</code>
          </div>
        )}

        {element.attributes && Object.keys(element.attributes).length > 0 && (
          <div className="flex items-start">
            <span className="text-gray-500 w-16 text-sm">Attrs:</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(element.attributes).map(([key, value], index) => (
                <code key={index} className="bg-gray-50 px-2 py-0.5 rounded text-sm">
                  {key}="{value}"
                </code>
              ))}
            </div>
          </div>
        )}

        {showMetadata && element.metadata && (
          <div className="mt-2 space-y-1">
            <div className="text-sm font-medium text-gray-500">Metadata:</div>
            {element.metadata.visibility && (
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-24">Visibility:</span>
                <span className={`px-2 py-0.5 rounded ${
                  element.metadata.visibility.isVisible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {element.metadata.visibility.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            )}
            {element.metadata.position && (
              <div className="text-sm">
                <span className="text-gray-500">Position: </span>
                <code className="bg-gray-50 px-2 py-0.5 rounded">
                  x: {element.metadata.position.x}, y: {element.metadata.position.y}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2 overflow-y-auto ${maxHeight}`}>
      {elements.map((element, index) => (
        <div 
          key={index}
          className={`border border-gray-200 rounded-lg ${
            selectedElement === element ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div 
            className="p-3 hover:bg-gray-50 cursor-pointer flex items-start justify-between"
            onClick={() => !isReadOnly && setSelectedElement(
              selectedElement === element ? null : element
            )}
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleElementExpansion(index);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {expandedElements.has(index) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <div>
                <code className="text-sm font-medium">
                  &lt;{element.tag}
                  {element.id && <span className="text-blue-600"> id="{element.id}"</span>}
                  {element.class && (
                    <span className="text-green-600"> class="{element.class.join(' ')}"</span>
                  )}
                  &gt;
                </code>
                {element.innerText && (
                  <span className="text-sm text-gray-500 ml-2">
                    {element.innerText.length > 50 
                      ? `${element.innerText.slice(0, 50)}...` 
                      : element.innerText}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  copyElementToClipboard(element, index);
                }}
              >
                {copiedIndex === index ? (
                  <span className="text-green-600 text-sm">Copied!</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {expandedElements.has(index) && (
            <div className="px-3 pb-3 border-t border-gray-100 mt-2 pt-2">
              {renderElementAttributes(element)}
              
              {element.xpath && (
                <div className="mt-2 flex items-center">
                  <Code className="w-4 h-4 text-gray-500 mr-2" />
                  <code className="text-xs bg-gray-50 px-2 py-1 rounded">
                    {element.xpath}
                  </code>
                </div>
              )}
            </div>
          )}

          {selectedElement === element && !isReadOnly && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <div className="mt-3 flex flex-wrap gap-2">
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

              {showTypeInput && selectedElement === element && (
                <div className="flex items-center gap-2 mt-3">
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

export default ElementSummary;

