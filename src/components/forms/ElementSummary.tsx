import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SelectedElement, RawElement } from '../../types';

interface ElementSummaryProps {
  filter: SelectedElement;
  onClose: () => void;
}

interface ElementMatch {
  tag: string;
  fullHtml: string;
  attributes: Record<string, string | string[]>;
  count: number;
}

export const ElementSummary: React.FC<ElementSummaryProps> = ({ filter, onClose }) => {
  const [matches, setMatches] = useState<ElementMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call
        // For now, we'll load the sample data and filter it
        const response = await fetch('/src/data/sample-elements.json');
        const elements: RawElement[] = await response.json();
        
        // Group matching elements by their structure
        const matchGroups = new Map<string, ElementMatch>();
        
        elements.forEach(element => {
          let matches = false;
          
          if (filter.type === 'id' && element.id === filter.selector.slice(1)) {
            matches = true;
          } else if (filter.type === 'class' && element.class?.includes(filter.selector.slice(1))) {
            matches = true;
          } else if (filter.type === 'tag' && element.tag === filter.selector) {
            matches = true;
          }

          if (matches) {
            const attributes: Record<string, string | string[]> = {};
            if (element.id) attributes.id = element.id;
            if (element.class) attributes.class = element.class;
            if (element.name) attributes.name = element.name;

            const key = JSON.stringify({ tag: element.tag, attributes });
            
            if (matchGroups.has(key)) {
              const group = matchGroups.get(key)!;
              group.count++;
            } else {
              const attributeString = Object.entries(attributes)
                .map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return `${key}="${value.join(' ')}"`;
                  }
                  return `${key}="${value}"`;
                })
                .join(' ');

              matchGroups.set(key, {
                tag: element.tag,
                fullHtml: `<${element.tag}${attributeString ? ' ' + attributeString : ''}>${element.tag === 'img' ? '' : '...'}</${element.tag}>`,
                attributes,
                count: 1
              });
            }
          }
        });

        setMatches(Array.from(matchGroups.values()).sort((a, b) => b.count - a.count));
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [filter]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">
          Elements matching <code className="bg-gray-100 px-1 py-0.5 rounded">{filter.selector}</code>
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No matching elements found
          </div>
        ) : (
          matches.map((match, index) => (
            <div key={index} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    <code>{`<${match.tag}>`}</code>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Found {match.count} {match.count === 1 ? 'instance' : 'instances'}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {match.fullHtml}
                </pre>
              </div>
              {Object.keys(match.attributes).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Attributes:</p>
                  <div className="space-y-1">
                    {Object.entries(match.attributes).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-gray-500">{key}:</span>{' '}
                        <code className="bg-gray-50 px-1 rounded">
                          {Array.isArray(value) ? value.join(' ') : value}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
