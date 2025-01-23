// Base Types
export type ID = string;
export type Timestamp = number;
export type ISO8601 = string;

// Element Types
export interface RawElement {
  tag: string;
  id: string | null;
  class: string[] | null;
  name: string | null;
  attributes?: Record<string, string>;
  innerText?: string;
  innerHTML?: string;
  xpath?: string;
  metadata?: {
    flowId?: string;
    timestamp?: string;
    confidence?: number;
    visibility?: {
      isVisible: boolean;
      inViewport: boolean;
      computedStyle?: {
        display: string;
        visibility: string;
        opacity: string;
      };
    };
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface ElementInfo {
  count: number;
  examples: RawElement[];
  metadata?: {
    commonAttributes?: Record<string, number>;
    averagePosition?: {
      x: number;
      y: number;
    };
    visibilityStats?: {
      visible: number;
      hidden: number;
    };
  };
}

export interface ParsedElements {
  ids: Map<string, ElementInfo>;
  classes: Map<string, ElementInfo>;
  tags: Map<string, ElementInfo>;
}

// Selection Types
export interface SelectedElement {
  selector: string;
  type: 'id' | 'class' | 'tag';
  count: number;
  metadata?: {
    confidence?: number;
    matchScore?: number;
    lastUsed?: Timestamp;
    usageCount?: number;
  };
}

// Action Types
export type ActionType = 
  | 'click' 
  | 'type' 
  | 'extract' 
  | 'wait' 
  | 'hover'
  | 'scroll'
  | 'select'
  | 'submit'
  | 'screenshot'
  | 'custom';

export interface ActionMetadata {
  timeout?: number;
  retries?: number;
  delay?: number;
  conditions?: {
    waitForElement?: string;
    waitForTimeout?: number;
    waitForVisible?: boolean;
    waitForEnabled?: boolean;
    waitForAttribute?: {
      name: string;
      value: string;
    };
  };
  validation?: {
    required?: boolean;
    format?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  extraction?: {
    attribute?: string;
    format?: 'text' | 'html' | 'value';
    transform?: 'trim' | 'lowercase' | 'uppercase' | 'number';
    multiple?: boolean;
  };
  scroll?: {
    behavior: 'auto' | 'smooth';
    block: 'start' | 'center' | 'end' | 'nearest';
    inline: 'start' | 'center' | 'end' | 'nearest';
  };
  selectionContext?: {
    selectedElements: SelectedElement[];
    selectedTab: 'ids' | 'classes' | 'tags';
    searchTerm: string;
    filteredElements?: {
      key: string;
      count: number;
      examples: RawElement[];
    }[];
  };
}

export interface TaskAction {
  type: ActionType;
  selector: string;
  selectorType: 'id' | 'class' | 'tag' | 'xpath' | 'css';
  value?: string;
  description: string;
  metadata?: ActionMetadata;
  error?: {
    message: string;
    code: string;
    timestamp: ISO8601;
    attempts: number;
  };
}

// Task Types
export interface CrawlerTask {
  id: ID;
  actions: TaskAction[];
  order: number;
  metadata?: {
    name?: string;
    description?: string;
    created?: Timestamp;
    modified?: Timestamp;
    tags?: string[];
    priority?: number;
    timeout?: number;
    retries?: number;
    dependencies?: ID[];
    executionStats?: {
      successCount: number;
      failureCount: number;
      lastExecuted?: Timestamp;
      averageExecutionTime?: number;
      errorRate?: number;
      lastError?: {
        message: string;
        timestamp: ISO8601;
      };
    };
  };
}

// Flow Types
export interface Flow {
  id: ID;
  name: string;
  tasks: CrawlerTask[];
  order: number;
  isAnalyzing?: boolean;
  description?: string;
  metadata?: {
    created?: Timestamp;
    modified?: Timestamp;
    lastExecuted?: Timestamp;
    executionCount?: number;
    averageExecutionTime?: number;
    successRate?: number;
    lastAnalyzed?: ISO8601;
    version?: string;
    author?: string;
    tags?: string[];
    category?: string;
    priority?: number;
    schedule?: {
      type: 'manual' | 'interval' | 'cron';
      value?: string;
      timezone?: string;
    };
  };
}

// Analysis Types
export interface ElementAnalysis {
  flowId: ID | null;
  elements: RawElement[];
  timestamp: Timestamp;
  metadata?: {
    url?: string;
    success?: boolean;
    duration?: number;
    error?: string;
    flowContext?: {
      startUrl?: string;
      existingFlows?: number;
      newTasks?: number;
    };
    performance?: {
      loadTime: number;
      processingTime: number;
      memoryUsage: number;
    };
    browser?: {
      name: string;
      version: string;
      platform: string;
    };
  };
}

// API Request/Response Types
export interface FlowAnalysisRequest {
  startUrl: string;
  flows: Flow[];
  tasks: CrawlerTask[];
  context: {
    timestamp: ISO8601;
    totalFlows: number;
    isTestMode: boolean;
    environment?: string;
    options?: {
      includeMetadata?: boolean;
      validateFlows?: boolean;
      maxExecutionTime?: number;
      stopOnError?: boolean;
      screenshot?: boolean;
      deviceEmulation?: {
        width: number;
        height: number;
        deviceScaleFactor: number;
        mobile: boolean;
      };
    };
  };
}

export interface FlowAnalysisResponse {
  elements: RawElement[];
  metadata: {
    startUrl: string;
    flowsExecuted: number;
    totalElements: number;
    timestamp: ISO8601;
    executionTime: number;
    flowMetrics?: {
      totalActions: number;
      successRate: number;
      coverage: number;
      performance: {
        averageActionTime: number;
        totalTime: number;
        memoryUsage: number;
      };
    };
  };
  errors?: Array<{
    message: string;
    code: string;
    taskId?: ID;
    actionIndex?: number;
    timestamp: ISO8601;
  }>;
}

export interface CreateCrawlerRequest {
  name: string;
  startUrl: string;
  flows: Flow[];
  config: CrawlerConfig;
  metadata: {
    createdAt: ISO8601;
    createdBy: string;
    version: string;
    description?: string;
    tags?: string[];
    priority?: number;
  };
}

export interface CreateCrawlerResponse {
  id: ID;
  status: 'created' | 'pending' | 'error';
  metadata?: {
    created: ISO8601;
    estimatedFirstRun?: ISO8601;
    config: CrawlerConfig;
  };
}

// Configuration Types
export interface CrawlerConfig {
  maxDepth: number;
  maxPages: number;
  delay?: number;
  timeout?: number;
  concurrency?: number;
  schedule?: {
    type: 'manual' | 'interval' | 'cron';
    value?: string;
    timezone?: string;
  };
  options?: {
    followRedirects?: boolean;
    respectRobotsTxt?: boolean;
    maxRetries?: number;
    userAgent?: string;
    proxy?: {
      enabled: boolean;
      url?: string;
      rotation?: boolean;
    };
    authentication?: {
      type: 'basic' | 'token' | 'oauth2';
      credentials?: {
        username?: string;
        password?: string;
        token?: string;
      };
    };
    headers?: Record<string, string>;
    cookies?: Array<{
      name: string;
      value: string;
      domain: string;
      path?: string;
    }>;
    javascript?: {
      enabled: boolean;
      timeout?: number;
      waitForNetwork?: boolean;
    };
  };
}

// Store Types
export interface ElementStoreState {
  analysisHistory: ElementAnalysis[];
  currentFlowId: ID | null;
  parsedElements: ParsedElements | null;
  isAnalyzing: boolean;
  error: string | null;
  metadata?: {
    lastUpdate: Timestamp;
    totalAnalyses: number;
    cacheStatus: 'fresh' | 'stale' | 'expired';
  };
}

export interface FlowStoreState {
  flows: Flow[];
  currentFlow: Flow | null;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  metadata?: {
    lastSync: Timestamp;
    totalFlows: number;
    activeFlows: number;
  };
}

// Component Props Types
export interface FlowListProps {
  flows: Flow[];
  currentFlowId: ID | null;
  onSelectFlow: (flowId: ID | null) => void;
  onDeleteFlow: (flowId: ID) => void;
  onCreateFlow: () => void;
  isLoading?: boolean;
  error?: string;
}

export interface TaskListProps {
  tasks: CrawlerTask[];
  onDeleteTask: (taskId: ID) => void;
  onReorderTasks: (startIndex: number, endIndex: number) => void;
  onEditTask?: (taskId: ID) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

export interface ElementSummaryProps {
  elements: RawElement[];
  onAddAction?: (action: TaskAction) => void;
  isReadOnly?: boolean;
  maxHeight?: string;
  showMetadata?: boolean;
}

export interface ActionButtonProps {
  type: ActionType;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
}

// Crawler Types
export interface Crawler {
  id: ID;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'completed';
  url: string;
  lastRun?: string;
  schedule?: string;
  createdAt: string;
  configuration: {
    depth: number;
    interval: number;
    maxPages: number;
  };
  metadata?: {
    version: string;
    author: string;
    created: ISO8601;
    modified: ISO8601;
    lastRun?: ISO8601;
    nextRun?: ISO8601;
    stats?: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
      averageRuntime: number;
      lastError?: {
        message: string;
        timestamp: ISO8601;
      };
    };
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: ISO8601;
  path?: string;
  requestId?: string;
}

export type ErrorWithContext = {
  error: Error;
  context: {
    component?: string;
    action?: string;
    timestamp: ISO8601;
    data?: unknown;
    requestId?: string;
  };
};

// Event Types
export interface FlowExecutionEvent {
  flowId: ID;
  type: 'start' | 'complete' | 'error' | 'pause' | 'resume';
  timestamp: ISO8601;
  metadata?: {
    duration?: number;
    error?: string;
    elementsFound?: number;
    memory?: number;
    cpu?: number;
  };
}

export interface TaskExecutionEvent {
  taskId: ID;
  flowId: ID;
  type: 'start' | 'complete' | 'error' | 'skip';
  timestamp: ISO8601;
  action?: TaskAction;
  result?: {
    success: boolean;
    error?: string;
    duration: number;
    retries: number;
    elements?: RawElement[];
  };
}

// Validation Types
export type ValidationResult = {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    timestamp: ISO8601;
    duration: number;
    validatedFields: string[];
  };
};

export type ElementMatcher = {
  type: 'id' | 'class' | 'tag' | 'xpath' | 'css';
  value: string;
  exact?: boolean;
  options?: {
    caseSensitive?: boolean;
    partial?: boolean;
    multiple?: boolean;
    timeout?: number;
  };
};

export type ElementPredicate = (element: RawElement) => boolean;

export type FlowValidationResult = {
  isValid: boolean;
  errors: {
    taskId: ID;
    actionIndex: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    code?: string;
    suggestion?: string;
  }[];
  metadata?: {
    timestamp: ISO8601;
    duration: number;
    checkedRules: string[];
  };
};

