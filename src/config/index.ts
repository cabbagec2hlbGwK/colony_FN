interface Config {
  apiUrl: string;
  useMockData: boolean;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true'
};

export default config;

