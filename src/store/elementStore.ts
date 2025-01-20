import { create } from 'zustand';
import type { RawElement, ParsedElements } from '../types';

interface ElementStore {
  rawElements: RawElement[];
  parsedElements: ParsedElements | null;
  isAnalyzing: boolean;
  error: string | null;
  setRawElements: (elements: RawElement[]) => void;
  clearElements: () => void;
  parseElements: () => void;
}

export const useElementStore = create<ElementStore>((set, get) => ({
  rawElements: [],
  parsedElements: null,
  isAnalyzing: false,
  error: null,

  setRawElements: (elements) => {
    set({ rawElements: elements });
    get().parseElements();
  },

  clearElements: () => {
    set({
      rawElements: [],
      parsedElements: null,
      error: null,
    });
  },

  parseElements: () => {
    const { rawElements } = get();
    
    try {
      const parsed: ParsedElements = {
        ids: new Map(),
        classes: new Map(),
        tags: new Map(),
        attributes: new Map(),
      };

      rawElements.forEach(element => {
        // Parse tags
        if (!parsed.tags.has(element.tag)) {
          parsed.tags.set(element.tag, {
            count: 1,
            examples: [element],
          });
        } else {
          const tagInfo = parsed.tags.get(element.tag)!;
          tagInfo.count++;
          if (tagInfo.examples.length < 3) { // Keep up to 3 examples
            tagInfo.examples.push(element);
          }
        }

        // Parse IDs
        if (element.id) {
          if (!parsed.ids.has(element.id)) {
            parsed.ids.set(element.id, {
              count: 1,
              examples: [element],
            });
          } else {
            const idInfo = parsed.ids.get(element.id)!;
            idInfo.count++;
            if (idInfo.examples.length < 3) {
              idInfo.examples.push(element);
            }
          }
        }

        // Parse Classes
        if (element.class) {
          element.class.forEach(className => {
            if (!parsed.classes.has(className)) {
              parsed.classes.set(className, {
                count: 1,
                examples: [element],
              });
            } else {
              const classInfo = parsed.classes.get(className)!;
              classInfo.count++;
              if (classInfo.examples.length < 3) {
                classInfo.examples.push(element);
              }
            }
          });
        }

        // Parse other attributes (like name)
        if (element.name) {
          const attrKey = `name=${element.name}`;
          if (!parsed.attributes.has(attrKey)) {
            parsed.attributes.set(attrKey, {
              count: 1,
              examples: [element],
            });
          } else {
            const attrInfo = parsed.attributes.get(attrKey)!;
            attrInfo.count++;
            if (attrInfo.examples.length < 3) {
              attrInfo.examples.push(element);
            }
          }
        }
      });

      set({ parsedElements: parsed, error: null });
    } catch (error) {
      set({ error: 'Failed to parse elements' });
      console.error('Error parsing elements:', error);
    }
  },
}));
