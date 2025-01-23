import config from '../config';
import type { 
  RawElement, 
  CrawlerTask, 
  Flow,
  FlowAnalysisRequest,
  FlowAnalysisResponse,
  CreateCrawlerRequest,
  CreateCrawlerResponse,
  ApiError,
  CrawlerConfig
} from '../types';

const API_BASE_URL = config.apiUrl;

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies if needed
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }));

      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Analyze a single URL for available elements
 */
export async function analyzeUrl(url: string): Promise<RawElement[]> {
  try {
    console.log('Analyzing URL:', url);
    
    return await apiRequest<RawElement[]>('/api/element', {
      method: 'POST',
      body: JSON.stringify({ url })
    });

  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw error;
  }
}

/**
 * Analyze a flow with its tasks and context
 */
export async function analyzeFlow(
  startUrl: string, 
  flows: Flow[], 
  tasks: CrawlerTask[]
): Promise<RawElement[]> {
  try {
    const analysisRequest: FlowAnalysisRequest = {
      startUrl,
      flows,
      tasks,
      context: {
        timestamp: new Date().toISOString(),
        totalFlows: flows.length,
        isTestMode: false,
        environment: import.meta.env.MODE,
        options: {
          includeMetadata: true,
          validateFlows: true,
          maxExecutionTime: 30000, // 30 seconds
          stopOnError: true
        }
      }
    };

    console.log('Sending flow analysis request:', analysisRequest);

    const response = await apiRequest<FlowAnalysisResponse>('/api/flowcheck', {
      method: 'POST',
      body: JSON.stringify(analysisRequest)
    });

    console.log('Flow Analysis Response:', response);
    return response.elements;

  } catch (error) {
    console.error('Error analyzing flow:', error);
    throw error;
  }
}

/**
 * Create a new crawler with flows and configuration
 */
export async function createCrawler(
  name: string,
  startUrl: string,
  flows: Flow[],
  config: CrawlerConfig
): Promise<CreateCrawlerResponse> {
  try {
    const request: CreateCrawlerRequest = {
      name,
      startUrl,
      flows,
      config,
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: 'user', // You might want to pass this from your auth system
        version: '1.0.0'
      }
    };

    return await apiRequest<CreateCrawlerResponse>('/api/crawlers', {
      method: 'POST',
      body: JSON.stringify(request)
    });

  } catch (error) {
    console.error('Error creating crawler:', error);
    throw error;
  }
}

/**
 * Update an existing crawler
 */
export async function updateCrawler(
  id: string,
  updates: Partial<CreateCrawlerRequest>
): Promise<void> {
  try {
    await apiRequest(`/api/crawlers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  } catch (error) {
    console.error('Error updating crawler:', error);
    throw error;
  }
}

/**
 * Delete a crawler
 */
export async function deleteCrawler(id: string): Promise<void> {
  try {
    await apiRequest(`/api/crawlers/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting crawler:', error);
    throw error;
  }
}

/**
 * Start a crawler
 */
export async function startCrawler(id: string): Promise<void> {
  try {
    await apiRequest(`/api/crawlers/${id}/start`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error starting crawler:', error);
    throw error;
  }
}

/**
 * Stop a crawler
 */
export async function stopCrawler(id: string): Promise<void> {
  try {
    await apiRequest(`/api/crawlers/${id}/stop`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error stopping crawler:', error);
    throw error;
  }
}

/**
 * Get crawler status
 */
export async function getCrawlerStatus(id: string): Promise<{
  status: 'running' | 'stopped' | 'error';
  lastRun?: string;
  nextRun?: string;
  stats?: {
    pagesProcessed: number;
    elementsFound: number;
    errors: number;
  };
}> {
  try {
    return await apiRequest(`/api/crawlers/${id}/status`, {
      method: 'GET'
    });
  } catch (error) {
    console.error('Error getting crawler status:', error);
    throw error;
  }
}

/**
 * Validate a flow
 */
export async function validateFlow(
  flow: Flow,
  startUrl: string
): Promise<{
  isValid: boolean;
  errors: Array<{
    taskId: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}> {
  try {
    return await apiRequest('/api/flows/validate', {
      method: 'POST',
      body: JSON.stringify({ flow, startUrl })
    });
  } catch (error) {
    console.error('Error validating flow:', error);
    throw error;
  }
}

/**
 * Get crawler results
 */
export async function getCrawlerResults(
  id: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{
  results: Array<{
    timestamp: string;
    url: string;
    elements: RawElement[];
    metadata?: Record<string, unknown>;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (options.page) queryParams.set('page', options.page.toString());
    if (options.limit) queryParams.set('limit', options.limit.toString());
    if (options.startDate) queryParams.set('startDate', options.startDate);
    if (options.endDate) queryParams.set('endDate', options.endDate);

    return await apiRequest(`/api/crawlers/${id}/results?${queryParams}`);
  } catch (error) {
    console.error('Error getting crawler results:', error);
    throw error;
  }
}

/**
 * Export crawler results
 */
export async function exportCrawlerResults(
  id: string,
  format: 'csv' | 'json',
  options: {
    startDate?: string;
    endDate?: string;
    fields?: string[];
  } = {}
): Promise<Blob> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.set('format', format);
    if (options.startDate) queryParams.set('startDate', options.startDate);
    if (options.endDate) queryParams.set('endDate', options.endDate);
    if (options.fields) queryParams.set('fields', options.fields.join(','));

    const response = await fetch(
      `${API_BASE_URL}/api/crawlers/${id}/export?${queryParams}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error exporting crawler results:', error);
    throw error;
  }
}

