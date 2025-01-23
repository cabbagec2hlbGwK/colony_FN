// Element Types
export interface RawElement {
  tag: string;
  id: string | null;
  class: string[] | null;
  name: string | null;
  metadata?: {
    flowId?: string;
    timestamp?: string;
    confidence?: number;
  };
}

export interface ElementInfo {
  count: number;
  examples: RawElement[];
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
}

// Action Types
export type ActionType = 'click' | 'type' | 'extract' | 'wait' | 'hover' | 'scroll';

export interface ActionMetadata {
  timeout?: number;
  retries?: number;
  delay?: number;
  conditions?: {
    waitForElement?: string;
    waitForTimeout?: number;
    waitForVisible?: boolean;
  };
}

export interface TaskAction {
  type: ActionType;
  selector: string;
  selectorType: 'id' | 'class' | 'tag';
  value?: string;
  description: string;
  metadata?: ActionMetadata;
}

// Task Types
export interface CrawlerTask {
  id: string;
  actions: TaskAction[];
  order: number;
  metadata?: {
    name?: string;
    description?: string;
    created?: number;
    modified?: number;
    executionStats?: {
      successCount: number;
      failureCount: number;
      lastExecuted?: number;
      averageExecutionTime?: number;
    };
  };
}

// Flow Types
export interface Flow {
  id: string;
  name: string;
  tasks: CrawlerTask[];
  order: number;
  isAnalyzing?: boolean;
  description?: string;
  metadata?: {
    created?: number;
    modified?: number;
    lastExecuted?: number;
    executionCount?: number;
    averageExecutionTime?: number;
    successRate?: number;
    lastAnalyzed?: string;
  };
}

// Analysis Types
export interface ElementAnalysis {
  flowId: string | null;
  elements: RawElement[];
  timestamp: number;
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
  };
}

// API Request/Response Types
export interface FlowAnalysisRequest {
  startUrl: string;
  flows: Flow[];
  context: {
    timestamp: string;
    totalFlows: number;
    isTestMode: boolean;
    environment?: string;
    options?: {
      includeMetadata?: boolean;
      validateFlows?: boolean;
      maxExecutionTime?: number;
      stopOnError?: boolean;
    };
  };
  newFlow: {
    tasks: CrawlerTask[];
    metadata: {
      createdAt: string;
      position: number;
    };
  };
}

export interface FlowAnalysisResponse {
  elements: RawElement[];
  metadata: {
    startUrl: string;
    flowsExecuted: number;
    totalElements: number;
    timestamp: string;
    executionTime: number;
    flowMetrics?: {
      totalActions: number;
      successRate: number;
      coverage: number;
    };
  };
}

export interface CreateCrawlerRequest {
  name: string;
  startUrl: string;
  flows: Flow[];
  config: CrawlerConfig;
  metadata: {
    createdAt: string;
    createdBy: string;
    version: string;
  };
}

export interface CreateCrawlerResponse {
  id: string;
  status: 'created' | 'pending' | 'error';
  metadata?: {
    created: string;
    estimatedFirstRun?: string;
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
    };
  };
}

// Store Types
export interface ElementStoreState {
  analysisHistory: ElementAnalysis[];
  currentFlowId: string | null;
  parsedElements: ParsedElements | null;
  isAnalyzing: boolean;
  error: string | null;
}

export interface FlowStoreState {
  flows: Flow[];
  currentFlow: Flow | null;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
}

// Component Props Types
export interface FlowListProps {
  flows: Flow[];
  currentFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
  onDeleteFlow: (flowId: string) => void;
  onCreateFlow: () => void;
}

export interface TaskListProps {
  tasks: CrawlerTask[];
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (startIndex: number, endIndex: number) => void;
  onEditTask?: (taskId: string) => void;
  isReadOnly?: boolean;
}

export interface ElementSummaryProps {
  elements: RawElement[];
  onAddAction?: (action: TaskAction) => void;
  isReadOnly?: boolean;
}

export interface ActionButtonProps {
  type: ActionType;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ElementSelectorProps {
  elements: ParsedElements;
  selectedElements: SelectedElement[];
  onElementSelect: (element: SelectedElement) => void;
  startUrl: string;
  flows: Flow[];
  onFlowCreated: (flow: Flow) => void;
}

// Utility Types
export type ValidationResult = {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
};

export type ElementMatcher = {
  type: 'id' | 'class' | 'tag';
  value: string;
  exact?: boolean;
  options?: {
    caseSensitive?: boolean;
    partial?: boolean;
  };
};

export type ElementPredicate = (element: RawElement) => boolean;

export type FlowValidationResult = {
  isValid: boolean;
  errors: {
    taskId: string;
    actionIndex: number;
    message: string;
    severity: 'error' | 'warning';
  }[];
};

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

export type ErrorWithContext = {
  error: Error;
  context: {
    component?: string;
    action?: string;
    timestamp: string;
    data?: unknown;
  };
};

// Event Types
export interface FlowExecutionEvent {
  flowId: string;
  type: 'start' | 'complete' | 'error';
  timestamp: string;
  metadata?: {
    duration?: number;
    error?: string;
    elementsFound?: number;
  };
}

export interface TaskExecutionEvent {
  taskId: string;
  flowId: string;
  type: 'start' | 'complete' | 'error';
  timestamp: string;
  action?: TaskAction;
  result?: {
    success: boolean;
    error?: string;
    duration: number;
  };
}
