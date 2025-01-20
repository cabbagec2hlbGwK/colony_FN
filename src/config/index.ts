interface Config {
  apiUrl: string;
  useMockData: boolean;
}

const config: Config = {
  // Use /api prefix for proxying in development
  apiUrl: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || ''),
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
};

export default config;
