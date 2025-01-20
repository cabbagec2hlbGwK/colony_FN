// ... existing types ...

export interface RawElement {
  tag: string;
  id: string | null;
  class: string[] | null;
  name: string | null;
}

export interface ElementInfo {
  count: number;
  examples: RawElement[];
}

export interface ParsedElements {
  ids: Map<string, ElementInfo>;
  classes: Map<string, ElementInfo>;
  tags: Map<string, ElementInfo>;
  attributes: Map<string, ElementInfo>;
}

export interface ElementStats {
  totalElements: number;
  uniqueIds: number;
  uniqueClasses: number;
  uniqueTags: number;
}
