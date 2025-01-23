import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, Play, Plus } from 'lucide-react';
import type { 
  ParsedElements, 
  SelectedElement, 
  TaskAction, 
  CrawlerTask, 
  Flow, 
  RawElement,
  ElementInfo
} from '../../types';
import { ElementSummary } from './ElementSummary';
import { useElementStore } from '../../store/elementStore';
import { TaskList } from './TaskList';
import { Button } from '../ui/Button';
import { analyzeFlow } from '../../services/api';

interface ElementSelectorProps {
  elements: ParsedElements;
  selectedElements: SelectedElement[];
  onElementSelect: (element: SelectedElement) => void;
  startUrl: string;
  flows: Flow[];
  onFlowCreated: (flow: Flow) => void;
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({ 
  elements: initialElements,
  selectedElements,
  onElementSelect,
  startUrl,
  flows,
  onFlowCreated
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ids' | 'classes' | 'tags'>('ids');
  const [tasks, setTasks] = useState<CrawlerTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localSelectedElements, setLocalSelectedElements] = useState<SelectedElement[]>([]);
  const [analyzedElements, setAnalyzedElements] = useState<{
    elements: RawElement[];
    tasks: CrawlerTask[];
  } | null>(null);
  const [flowName, setFlowName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Store hooks
  const { 
    currentFlowId, 
    addAnalysis, 
    setCurrentFlow,
    getRawElements,
    parseElements,
    parsedElements 
  } = useElementStore();

  // Use either passed selectedElements or local ones based on whether we're in a flow
  const effectiveSelectedElements = currentFlowId ? localSelectedElements : selectedElements;

  // Use either store's parsedElements or initial elements based on whether we're in a flow
  const effectiveElements = currentFlowId ? parsedElements : initialElements;

  // Filter elements based on search term and selected tab
  const filteredElements = useMemo(() => {
    if (!effectiveElements) return [];

    const term = searchTerm.toLowerCase();
    const currentMap = effectiveElements[selectedTab];
    
    return Array.from(currentMap.entries())
      .filter(([key, info]) => 
        key.toLowerCase().includes(term) ||
        info.examples.some(ex => ex.tag.toLowerCase().includes(term))
      )
      .sort((a, b) => b[1].count - a[1].count);
  }, [effectiveElements, selectedTab, searchTerm]);

  // Filter raw elements based on selected elements
  const filteredRawElements = useMemo(() => {
    if (effectiveSelectedElements.length === 0) return [];

    const rawElements = getRawElements();
    if (!rawElements || rawElements.length === 0) {
      console.log('No raw elements found for filtering');
      return [];
    }

    // Filter elements that match ANY of the selected criteria (OR operation)
    return rawElements.filter(element => {
      return effectiveSelectedElements.some(selected => {
        switch (selected.type) {
          case 'id':
            return element.id === selected.selector.slice(1);
          case 'class':
            return element.class?.includes(selected.selector.slice(1));
          case 'tag':
            return element.tag === selected.selector;
          default:
            return false;
        }
      });
    });
  }, [effectiveSelectedElements, getRawElements]);

  // Debug logging
  useEffect(() => {
    console.log('Selected Elements:', effectiveSelectedElements);
    console.log('Matching Elements:', filteredRawElements);
  }, [effectiveSelectedElements, filteredRawElements]);

  // Handlers
  const handleAddAction = (action: TaskAction) => {
    const newTask: CrawlerTask = {
      id: crypto.randomUUID(),
      actions: [{
        ...action,
        metadata: {
          selectionContext: {
            selectedElements: effectiveSelectedElements,
            selectedTab,
            searchTerm,
            filteredElements: filteredElements.map(([key, info]) => ({
              key,
              count: info.count,
              examples: info.examples
            }))
          }
        }
      }],
      order: tasks.length
    };
    setTasks([...tasks, newTask]);
    setLocalSelectedElements([]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleReorderTasks = (startIndex: number, endIndex: number) => {
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(startIndex, 1);
    newTasks.splice(endIndex, 0, removed);
    
    newTasks.forEach((task, index) => {
      task.order = index;
    });
    
    setTasks(newTasks);
  };

  const handleAnalyzeFlow = async () => {
    if (tasks.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const currentFlow = {
        id: 'temp-flow',
        name: 'Current Analysis',
        tasks: tasks.map(task => ({
          ...task,
          metadata: {
            ...task.metadata,
            selectionContext: {
              selectedElements: effectiveSelectedElements,
              selectedTab,
              searchTerm,
              filteredElements: filteredElements.map(([key, info]) => ({
                key,
                count: info.count,
                examples: info.examples
              }))
            }
          }
        })),
        order: flows.length,
        isAnalyzing: true
      };

      const allFlows = [...flows, currentFlow];

      console.log('Analyzing flows with selection context:', {
        startUrl,
        flows: allFlows,
        currentFlow,
        selectionContext: {
          selectedElements: effectiveSelectedElements,
          selectedTab,
          searchTerm,
          filteredElementsCount: filteredElements.length
        }
      });

      const elements = await analyzeFlow(startUrl, allFlows, currentFlow.tasks);
      
      setAnalyzedElements({
        elements,
        tasks: currentFlow.tasks
      });

      addAnalysis({
        flowId: 'temp-analysis',
        elements,
        timestamp: Date.now(),
        metadata: {
          success: true,
          stepsExecuted: tasks.length,
          flowContext: {
            startUrl,
            existingFlows: flows.length,
            newTasks: tasks.length,
            selectionContext: {
              selectedElements: effectiveSelectedElements,
              selectedTab,
              searchTerm
            }
          }
        }
      });

      setLocalSelectedElements([]);
      parseElements();
      setShowNameInput(true);

    } catch (error) {
      console.error('Flow analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateFlow = () => {
    if (!analyzedElements || !flowName.trim()) return;

    const newFlow: Flow = {
      id: crypto.randomUUID(),
      name: flowName.trim(),
      tasks: analyzedElements.tasks,
      order: flows.length,
      metadata: {
        created: Date.now(),
        lastExecuted: Date.now(),
        executionCount: 1,
        averageExecutionTime: 0
      }
    };

    onFlowCreated(newFlow);

    addAnalysis({
      flowId: newFlow.id,
      elements: analyzedElements.elements,
      timestamp: Date.now(),
      metadata: {
        success: true,
        stepsExecuted: analyzedElements.tasks.length,
        flowName: newFlow.name
      }
    });

    setAnalyzedElements(null);
    setTasks([]);
    setFlowName('');
    setShowNameInput(false);
  };

  const handleCancelAnalysis = () => {
    setAnalyzedElements(null);
    setCurrentFlow(null);
    setFlowName('');
    setShowNameInput(false);
    parseElements();
  };

  const handleElementSelect = (key: string, count: number) => {
    const element: SelectedElement = {
      selector: selectedTab === 'ids' ? `#${key}` : 
               selectedTab === 'classes' ? `.${key}` : key,
      type: selectedTab === 'ids' ? 'id' : 
            selectedTab === 'classes' ? 'class' : 'tag',
      count
    };

    if (currentFlowId) {
      setLocalSelectedElements(prev => {
        const exists = prev.some(e => 
          e.selector === element.selector && e.type === element.type
        );

        if (exists) {
          return prev.filter(e => 
            !(e.selector === element.selector && e.type === element.type)
          );
        }

        return [...prev, element];
      });
    } else {
      onElementSelect(element);
    }
  };

  const isSelected = (selector: string, type: 'id' | 'class' | 'tag') => {
    return effectiveSelectedElements.some(e => e.selector === selector && e.type === type);
  };

  const renderElementExample = (info: ElementInfo) => {
    const example = info.examples[0];
    return (
      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
        {`<${example.tag}${example.id ? ` id="${example.id}"` : ''}${
          example.class ? ` class="${example.class.join(' ')}"` : ''
        }${example.name ? ` name="${example.name}"` : ''}>${
          example.tag === 'img' ? '' : '...'
        }</${example.tag}>`}
      </pre>
    );
  };

  return (
    <div className="space-y-4">
      {/* Flows Section */}
      {flows.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium mb-4">Created Flows</h3>
          <div className="space-y-2">
            {flows.map((flow) => (
              <div 
                key={flow.id}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{flow.name}</span>
                  <span className="text-sm text-gray-500">
                    {flow.tasks.length} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Element Selector Section */}
      {effectiveElements && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search elements..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['ids', 'classes', 'tags'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({effectiveElements[tab].size})
                </button>
              ))}
            </nav>
          </div>

          {/* Elements List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredElements.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No elements found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredElements.map(([key, info]) => {
                  const selector = selectedTab === 'ids' ? `#${key}` : 
                                 selectedTab === 'classes' ? `.${key}` : key;
                  const type = selectedTab === 'ids' ? 'id' : 
                              selectedTab === 'classes' ? 'class' : 'tag';
                  const selected = isSelected(selector, type);
                  
                  return (
                    <div
                      key={key}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleElementSelect(key, info.count)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded border mr-2 flex items-center justify-center ${
                              selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {selector}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 ml-7">
                            Found in {info.count} {info.count === 1 ? 'element' : 'elements'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 ml-7">
                        <p className="text-xs text-gray-500">Example:</p>
                        {renderElementExample(info)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Current Tasks</h3>
            {analyzedElements ? (
              <div className="space-y-4">
                {showNameInput && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter flow name"
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={handleCreateFlow}
                      disabled={!flowName.trim()}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Flow
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleCancelAnalysis}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={handleAnalyzeFlow}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Analyze Flow
                  </>
                )}
              </Button>
            )}
          </div>
          <TaskList
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
          />
        </div>
      )}

      {/* Matching Elements Section */}
      {effectiveSelectedElements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">
              Matching Elements ({filteredRawElements.length})
            </h3>
            {analyzedElements && (
              <span className="text-sm text-gray-500">
                Preview of elements after flow execution
              </span>
            )}
          </div>
          {filteredRawElements.length > 0 ? (
            <ElementSummary 
              elements={filteredRawElements} 
              onAddAction={handleAddAction}
            />
          ) : (
            <div className="text-center text-gray-500 py-4">
              No matching elements found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementSelector;

