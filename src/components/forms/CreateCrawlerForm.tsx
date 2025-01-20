import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Search, Loader2 } from 'lucide-react';
import { ElementSelector } from './ElementSelector';
import { analyzePage } from '../../lib/pageAnalyzer';
import type { PageElements, SelectedElement } from '../../types';

interface CreateCrawlerFormProps {
  onCancel?: () => void;
}

export const CreateCrawlerForm: React.FC<CreateCrawlerFormProps> = ({
  onCancel
}) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elements, setElements] = useState<PageElements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    setSelectedElements([]);

    try {
      const pageElements = await analyzePage(url);
      setElements(pageElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleElementSelect = (element: SelectedElement) => {
    setSelectedElements(prev => {
      const exists = prev.some(e => 
        e.selector === element.selector && e.type === element.type
      );

      if (exists) {
        return prev.filter(e => 
          !(e.selector === element.selector && e.type === element.type)
        );
      }

      return [...prev, element];
    });
  };

  const handleElementRemove = (element: SelectedElement) => {
    setSelectedElements(prev => 
      prev.filter(e => 
        !(e.selector === element.selector && e.type === element.type)
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* URL Analysis Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start URL
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com"
            />
            <Button
              type="button"
              onClick={handleAnalyzeUrl}
              disabled={isAnalyzing || !url}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {selectedElements.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected Elements ({selectedElements.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedElements.map((element) => (
                <div
                  key={`${element.type}-${element.selector}`}
                  className="inline-flex items-center bg-white rounded-full px-3 py-1 text-sm border border-blue-200"
                >
                  <span className="mr-1 text-blue-600">
                    {element.type}:
                  </span>
                  <span className="mr-2">{element.selector}</span>
                  <button
                    onClick={() => handleElementRemove(element)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {elements && (
          <ElementSelector 
            elements={elements}
            selectedElements={selectedElements}
            onElementSelect={handleElementSelect}
          />
        )}
      </div>

      {/* Rest of the form */}
      <div className="space-y-6 border-t border-gray-200 pt-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Crawler Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="My Crawler"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Depth
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Pages
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Schedule (optional)
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Manual</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={selectedElements.length === 0}
          >
            Create Crawler
          </Button>
        </div>
      </div>
    </div>
  );
};
