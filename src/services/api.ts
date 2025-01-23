import config from '../config';
import type { 
  RawElement, 
  CrawlerTask, 
  Flow
} from '../types';

const API_BASE_URL = config.apiUrl;

export async function analyzeUrl(url: string): Promise<RawElement[]> {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/api/element`);
    
    const response = await fetch(`${API_BASE_URL}/api/element`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies if needed
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('URL Analysis Response:', data);
    return data;

  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw error; // Throw the original error for better debugging
  }
}

export async function analyzeFlow(
  startUrl: string, 
  flows: Flow[], 
  tasks: CrawlerTask[]
): Promise<RawElement[]> {
  try {
    const analysisRequest = {
      startUrl,
      flows,
      tasks
    };

    console.log('Sending flow analysis request:', analysisRequest);

    const response = await fetch(`${API_BASE_URL}/api/flowcheck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies if needed
      body: JSON.stringify(analysisRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('Flow Analysis Response:', data);
    return data;

  } catch (error) {
    console.error('Error analyzing flow:', error);
    throw error; // Throw the original error for better debugging
  }
}

