import config from '../config';
import type { RawElement } from '../types';
import sampleData from '../data/sample-elements.json';

export async function analyzeUrl(url: string): Promise<RawElement[]> {
  if (config.useMockData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return sampleData;
  }

  try {
    const response = await fetch(`${config.apiUrl}/elements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform backend response to match our types
    return data.map((element: any) => ({
      ...element,
      class: element.class_ // Backend uses class_, we use class
    }));
  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw new Error('Failed to analyze URL. Please check the backend connection.');
  }
}
