// Update the RawElement type to match backend response
export interface RawElement {
  tag: string;
  id: string | null;
  class: string[] | null;  // This matches the backend's array format
  name: string | null;
}

// ... rest of the types remain the same
