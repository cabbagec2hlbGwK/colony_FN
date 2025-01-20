import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { CrawlerCard } from '../components/dashboard/CrawlerCard';
import { CreateCrawlerForm } from '../components/forms/CreateCrawlerForm';

const mockCrawlers = [
  {
    id: '1',
    name: 'E-commerce Scraper',
    status: 'running',
    url: 'https://example-shop.com',
    lastRun: '2024-03-10 15:30',
    schedule: 'Daily',
    createdAt: '2024-03-01',
    configuration: {
      depth: 3,
      interval: 1000,
      maxPages: 1000,
    },
  },
  {
    id: '2',
    name: 'News Aggregator',
    status: 'completed',
    url: 'https://news-site.com',
    lastRun: '2024-03-09 12:00',
    schedule: 'Hourly',
    createdAt: '2024-02-28',
    configuration: {
      depth: 2,
      interval: 2000,
      maxPages: 500,
    },
  },
] as const;

export function CrawlersPage() {
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Crawlers</h1>
          <Button
            size="lg"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Crawler
          </Button>
        </div>

        {showCreateForm ? (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create New Crawler</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
            <CreateCrawlerForm onCancel={() => setShowCreateForm(false)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockCrawlers.map((crawler) => (
              <CrawlerCard
                key={crawler.id}
                crawler={crawler}
                onStart={(id) => console.log('Start', id)}
                onStop={(id) => console.log('Stop', id)}
                onDelete={(id) => console.log('Delete', id)}
                onEdit={(id) => console.log('Edit', id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
