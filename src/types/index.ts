export interface Crawler {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'completed';
  url: string;
  schedule?: string;
  lastRun?: string;
  createdAt: string;
  configuration: {
    depth: number;
    interval: number;
    maxPages: number;
    allowedDomains?: string[];
    selectors: SelectedElement[];
  };
}

export interface CrawlerStats {
  pagesScraped: number;
  timeElapsed: string;
  dataCollected: number;
  errors: number;
}

export interface ElementInfo {
  selector: string;
  count: number;
  example: string;
}

export interface PageElements {
  id: ElementInfo[];
  class: ElementInfo[];
  tag: ElementInfo[];
}

export interface SelectedElement {
  selector: string;
  type: 'id' | 'class' | 'tag';
  count: number;
}

export interface RawElement {
  tag: string;
  id: string | null;
  class: string[] | null;
  name: string | null;
}
