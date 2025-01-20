import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { 
  BugPlay,
  Database, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { StatCard } from './components/dashboard/StatCard';

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Crawlers"
            value="12"
            icon={BugPlay}
            trend={{ value: 10, isPositive: true }}
          />
          <StatCard
            title="Data Collected"
            value="1.2M"
            icon={Database}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Failed Jobs"
            value="3"
            icon={AlertCircle}
            trend={{ value: 2, isPositive: false }}
          />
          <StatCard
            title="Average Runtime"
            value="2.5m"
            icon={Clock}
          />
        </div>

        {/* Add more dashboard content here */}
      </main>
    </div>
  );
}

export default App;
