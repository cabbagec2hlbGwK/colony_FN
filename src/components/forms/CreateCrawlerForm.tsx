import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Search, Loader2 } from 'lucide-react';
import { ElementSelector } from './ElementSelector';
import { analyzeUrl } from '../../services/api';
import { useElementStore } from '../../store/elementStore';
import { ElementStats } from './ElementStats';
import type { SelectedElement, Flow } from '../../types';

interface CreateCrawlerFormProps {
  onCancel?: () => void;
}

export const CreateCrawlerForm: React.FC<CreateCrawlerFormProps> = ({
  onCancel
}) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [crawlerName, setCrawlerName] = useState('');
  const [maxDepth, setMaxDepth] = useState('3');
  const [maxPages, setMaxPages] = useState('1000');
  const [schedule, setSchedule] = useState('');
  
  const { 
    parsedElements,
    addAnalysis,
    clearElements
  } = useElementStore();

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    clearElements();

    try {
      const elements = await analyzeUrl(url);
      addAnalysis({
        flowId: null, // null indicates this is the initial URL analysis
        elements,
        timestamp: Date.now(),
        metadata: {
          url,
          success: true
        }
      });
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

  const handleFlowCreated = (flow: Flow) => {
    setFlows(prev => [...prev, flow]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const crawler = {
      name: crawlerName,
      startUrl: url,
      config: {
        maxDepth: parseInt(maxDepth),
        maxPages: parseInt(maxPages),
        schedule: schedule || null
      },
      flows
    };

    // Here you would typically send the crawler configuration to your backend
    console.log('Creating crawler:', crawler);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              required
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

        {parsedElements && (
          <>
            <ElementStats elements={parsedElements} />
            <ElementSelector 
              elements={parsedElements}
              selectedElements={selectedElements}
              onElementSelect={handleElementSelect}
              startUrl={url}
              flows={flows}
              onFlowCreated={handleFlowCreated}
            />
          </>
        )}
      </div>

      <div className="space-y-6 border-t border-gray-200 pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Crawler Name
          </label>
          <input
            type="text"
            value={crawlerName}
            onChange={(e) => setCrawlerName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="My Crawler"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Depth
            </label>
            <input
              type="number"
              value={maxDepth}
              onChange={(e) => setMaxDepth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
              max="10"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Pages
            </label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Schedule (optional)
          </label>
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Manual</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            variant="primary" 
            type="submit"
            disabled={!url || !crawlerName || flows.length === 0}
          >
            Create Crawler
          </Button>
        </div>
      </div>
    </form>
  );
};
