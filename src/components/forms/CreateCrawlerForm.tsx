import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Search, Loader2 } from 'lucide-react';
import { ElementSelector } from './ElementSelector';
import { analyzePage } from '../../lib/pageAnalyzer';
import { useElementStore } from '../../store/elementStore';
import { ElementStats } from './ElementStats';

// ... rest of your imports

export const CreateCrawlerForm: React.FC<CreateCrawlerFormProps> = ({
  onCancel
}) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    parsedElements,
    setRawElements,
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
      setRawElements(elements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
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

        {parsedElements && (
          <>
            <ElementStats elements={parsedElements} />
            <ElementSelector elements={parsedElements} />
          </>
        )}
      </div>

      {/* Rest of your form */}
    </div>
  );
};
