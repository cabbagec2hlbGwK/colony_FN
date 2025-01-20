import config from '../config';
import type { RawElement } from '../types';
import sampleData from '../data/sample-elements.json';

export async function analyzeUrl(url: string): Promise<RawElement[]> {
  if (config.useMockData) {
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
      mode: 'cors',
      credentials: 'same-origin',
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Transform the response to match our RawElement type
    return data.map((element: any) => ({
      tag: element.tag,
      id: element.id,
      class: Array.isArray(element.class) ? element.class : 
             (element.class ? [element.class] : null), // Handle both array and string cases
      name: element.name
    }));
  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw new Error('Failed to analyze URL. Please check the backend connection.');
  }
}
