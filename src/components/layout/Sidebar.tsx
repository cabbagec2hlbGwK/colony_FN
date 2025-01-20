import React from 'react';
import { 
  LayoutDashboard, 
  BugPlay,  // Changed from Spider to BugPlay
  Settings, 
  BarChart2, 
  List 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Crawlers', icon: BugPlay, href: '/crawlers' },
  { name: 'Results', icon: List, href: '/results' },
  { name: 'Analytics', icon: BarChart2, href: '/analytics' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center">
        <h1 className="text-xl font-bold text-white">Crawler Manager</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className="group flex items-center rounded-lg px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Icon className="mr-3 h-6 w-6" />
              {item.name}
            </a>
          );
        })}
      </nav>
    </div>
  );
};
