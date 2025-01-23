import { create } from 'zustand';
import type { 
  RawElement, 
  ParsedElements, 
  ElementAnalysis, 
  ElementInfo 
} from '../types';

interface ElementStore {
  analysisHistory: ElementAnalysis[];
  currentFlowId: string | null;
  parsedElements: ParsedElements | null;
  isAnalyzing: boolean;
  error: string | null;
  
  addAnalysis: (analysis: ElementAnalysis) => void;
  setCurrentFlow: (flowId: string | null) => void;
  clearElements: () => void;
  parseElements: () => void;
  getRawElements: () => RawElement[];
}

export const useElementStore = create<ElementStore>((set, get) => ({
  analysisHistory: [],
  currentFlowId: null,
  parsedElements: null,
  isAnalyzing: false,
  error: null,

  addAnalysis: (analysis) => {
    set(state => {
      // Remove any existing analysis for this flowId
      const filteredHistory = state.analysisHistory.filter(
        a => a.flowId !== analysis.flowId
      );
      
      return {
        analysisHistory: [...filteredHistory, analysis],
        currentFlowId: analysis.flowId
      };
    });
    get().parseElements();
  },

  setCurrentFlow: (flowId) => {
    set({ currentFlowId: flowId });
    get().parseElements();
  },

  clearElements: () => {
    set({
      analysisHistory: [],
      currentFlowId: null,
      parsedElements: null,
      error: null,
    });
  },

  getRawElements: () => {
    const { analysisHistory, currentFlowId } = get();
    const currentAnalysis = analysisHistory.find(a => a.flowId === currentFlowId);
    
    if (!currentAnalysis) {
      console.log('No analysis found for flowId:', currentFlowId);
      console.log('Available analyses:', analysisHistory);
      return [];
    }
    
    return currentAnalysis.elements;
  },

  parseElements: () => {
    const { analysisHistory, currentFlowId } = get();
    
    try {
      const currentAnalysis = analysisHistory.find(a => a.flowId === currentFlowId);

      if (!currentAnalysis) {
        console.log('No analysis found for parsing, flowId:', currentFlowId);
        set({ parsedElements: null });
        return;
      }

      const parsed: ParsedElements = {
        ids: new Map<string, ElementInfo>(),
        classes: new Map<string, ElementInfo>(),
        tags: new Map<string, ElementInfo>(),
      };

      currentAnalysis.elements.forEach(element => {
        // Parse tags
        if (!parsed.tags.has(element.tag)) {
          parsed.tags.set(element.tag, {
            count: 1,
            examples: [element],
          });
        } else {
          const tagInfo = parsed.tags.get(element.tag)!;
          tagInfo.count++;
          if (tagInfo.examples.length < 3) {
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
            if (!className) return;
            
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
      });

      console.log('Parsed elements:', {
        ids: Array.from(parsed.ids.entries()),
        classes: Array.from(parsed.classes.entries()),
        tags: Array.from(parsed.tags.entries()),
      });

      set({ parsedElements: parsed, error: null });
    } catch (error) {
      console.error('Error parsing elements:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to parse elements',
        parsedElements: null 
      });
    }
  },
}));

// Debug middleware
if (process.env.NODE_ENV === 'development') {
  useElementStore.subscribe((state) => {
    console.log('ElementStore updated:', {
      currentFlowId: state.currentFlowId,
      analysisHistoryLength: state.analysisHistory.length,
      hasParsedElements: !!state.parsedElements,
      error: state.error,
    });
  });
}
