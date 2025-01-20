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
        'Accept': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'same-origin', // Changed from 'include' to 'same-origin'
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
