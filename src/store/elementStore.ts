import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  RawElement, 
  ParsedElements, 
  ElementAnalysis, 
  ElementInfo,
  ElementStoreState,
  ID
} from '../types';

interface ElementStore extends ElementStoreState {
  // Core Methods
  addAnalysis: (analysis: ElementAnalysis) => void;
  setCurrentFlow: (flowId: ID | null) => void;
  clearElements: () => void;
  parseElements: () => void;
  getRawElements: () => RawElement[];
  
  // Additional Methods
  updateAnalysis: (analysisId: string, updates: Partial<ElementAnalysis>) => void;
  deleteAnalysis: (analysisId: string) => void;
  getAnalysisById: (analysisId: string) => ElementAnalysis | undefined;
  getElementsForFlow: (flowId: ID) => RawElement[];
  
  // Cache Management
  invalidateCache: () => void;
  refreshAnalysis: (flowId: ID) => Promise<void>;
  
  // Element Operations
  getElementsBySelector: (selector: string, type: 'id' | 'class' | 'tag') => RawElement[];
  getElementStats: () => {
    totalElements: number;
    uniqueIds: number;
    uniqueClasses: number;
    uniqueTags: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useElementStore = create<ElementStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        analysisHistory: [],
        currentFlowId: null,
        parsedElements: null,
        isAnalyzing: false,
        error: null,
        metadata: {
          lastUpdate: Date.now(),
          totalAnalyses: 0,
          cacheStatus: 'fresh'
        },

        // Core Methods
        addAnalysis: (analysis) => {
          set(state => {
            // Remove any existing analysis for this flowId
            const filteredHistory = state.analysisHistory.filter(
              a => a.flowId !== analysis.flowId
            );
            
            return {
              analysisHistory: [...filteredHistory, analysis],
              currentFlowId: analysis.flowId,
              metadata: {
                ...state.metadata,
                lastUpdate: Date.now(),
                totalAnalyses: filteredHistory.length + 1,
                cacheStatus: 'fresh'
              }
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
            metadata: {
              lastUpdate: Date.now(),
              totalAnalyses: 0,
              cacheStatus: 'fresh'
            }
          });
        },

        getRawElements: () => {
          const { analysisHistory, currentFlowId } = get();
          
          // First try to get analysis for current flow
          let currentAnalysis = analysisHistory.find(a => a.flowId === currentFlowId);
          
          // If no current flow analysis found, get the most recent analysis
          if (!currentAnalysis && analysisHistory.length > 0) {
            currentAnalysis = analysisHistory[analysisHistory.length - 1];
          }
          
          if (!currentAnalysis) {
            console.log('No analysis found for elements');
            return [];
          }
          
          console.log('Found analysis with elements:', currentAnalysis.elements.length);
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

            set({ 
              parsedElements: parsed, 
              error: null,
              metadata: {
                ...get().metadata,
                lastUpdate: Date.now(),
                cacheStatus: 'fresh'
              }
            });

          } catch (error) {
            console.error('Error parsing elements:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to parse elements',
              parsedElements: null 
            });
          }
        },

        // Additional Methods
        updateAnalysis: (analysisId, updates) => {
          set(state => ({
            analysisHistory: state.analysisHistory.map(analysis =>
              analysis.flowId === analysisId
                ? { ...analysis, ...updates }
                : analysis
            )
          }));
          get().parseElements();
        },

        deleteAnalysis: (analysisId) => {
          set(state => ({
            analysisHistory: state.analysisHistory.filter(
              analysis => analysis.flowId !== analysisId
            )
          }));
          get().parseElements();
        },

        getAnalysisById: (analysisId) => {
          return get().analysisHistory.find(
            analysis => analysis.flowId === analysisId
          );
        },

        getElementsForFlow: (flowId) => {
          const analysis = get().analysisHistory.find(
            a => a.flowId === flowId
          );
          return analysis?.elements || [];
        },

        // Cache Management
        invalidateCache: () => {
          set(state => ({
            metadata: {
              ...state.metadata,
              cacheStatus: 'stale'
            }
          }));
        },

        refreshAnalysis: async (flowId) => {
          set({ isAnalyzing: true });
          try {
            // Here you would typically re-fetch the analysis from your API
            // For now, we'll just update the timestamp
            set(state => ({
              analysisHistory: state.analysisHistory.map(analysis =>
                analysis.flowId === flowId
                  ? { ...analysis, timestamp: Date.now() }
                  : analysis
              ),
              metadata: {
                ...state.metadata,
                lastUpdate: Date.now(),
                cacheStatus: 'fresh'
              }
            }));
          } catch (error) {
            set({ error: 'Failed to refresh analysis' });
          } finally {
            set({ isAnalyzing: false });
          }
        },

        // Element Operations
        getElementsBySelector: (selector, type) => {
          const elements = get().getRawElements();
          
          switch (type) {
            case 'id':
              return elements.filter(el => el.id === selector.slice(1));
            case 'class':
              return elements.filter(el => el.class?.includes(selector.slice(1)));
            case 'tag':
              return elements.filter(el => el.tag === selector);
            default:
              return [];
          }
        },

        getElementStats: () => {
          const { parsedElements } = get();
          if (!parsedElements) {
            return {
              totalElements: 0,
              uniqueIds: 0,
              uniqueClasses: 0,
              uniqueTags: 0
            };
          }

          return {
            totalElements: get().getRawElements().length,
            uniqueIds: parsedElements.ids.size,
            uniqueClasses: parsedElements.classes.size,
            uniqueTags: parsedElements.tags.size
          };
        }
      }),
      {
        name: 'element-store',
        partialize: (state) => ({
          analysisHistory: state.analysisHistory,
          currentFlowId: state.currentFlowId
        })
      }
    ),
    {
      name: 'ElementStore'
    }
  )
);

// Debug middleware
if (process.env.NODE_ENV === 'development') {
  useElementStore.subscribe((state) => {
    console.log('ElementStore updated:', {
      currentFlowId: state.currentFlowId,
      analysisHistoryLength: state.analysisHistory.length,
      hasParsedElements: !!state.parsedElements,
      error: state.error,
      metadata: state.metadata
    });
  });
}

export { useElementStore };

