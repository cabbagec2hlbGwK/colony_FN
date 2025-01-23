import React, { useState, useMemo } from 'react';
import { Search, Check, X, Play, Plus } from 'lucide-react';
import type { ParsedElements, SelectedElement, TaskAction, CrawlerTask, Flow, RawElement } from '../../types';
import { ElementSummary } from './ElementSummary';
import { useElementStore } from '../../store/elementStore';
import { TaskList } from './TaskList';
import { FlowList } from './FlowList';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ids' | 'classes' | 'tags'>('ids');
  const { 
    currentFlowId, 
    addAnalysis, 
    setCurrentFlow,
    getRawElements,
    parseElements,
    parsedElements 
  } = useElementStore();
  
  const [tasks, setTasks] = useState<CrawlerTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localSelectedElements, setLocalSelectedElements] = useState<SelectedElement[]>([]);
  const [analyzedElements, setAnalyzedElements] = useState<{
    elements: RawElement[];
    tasks: CrawlerTask[];
  } | null>(null);
  const [flowName, setFlowName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Use either passed selectedElements or local ones based on whether we're in a flow
  const effectiveSelectedElements = currentFlowId ? localSelectedElements : selectedElements;

  // Use either store's parsedElements or initial elements based on whether we're in a flow
  const effectiveElements = currentFlowId ? parsedElements : initialElements;

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

  const filteredRawElements = useMemo(() => {
    if (effectiveSelectedElements.length === 0) return [];

    const rawElements = getRawElements();
    if (!rawElements || rawElements.length === 0) {
      console.log('No raw elements found for filtering');
      return [];
    }

    return rawElements.filter(element => {
      return effectiveSelectedElements.every(selected => {
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

  const handleAddAction = (action: TaskAction) => {
    const newTask: CrawlerTask = {
      id: crypto.randomUUID(),
      actions: [action],
      order: tasks.length
    };
    setTasks([...tasks, newTask]);
    setLocalSelectedElements([]); // Clear selections after adding action
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleReorderTasks = (startIndex: number, endIndex: number) => {
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(startIndex, 1);
    newTasks.splice(endIndex, 0, removed);
    
    // Update order property
    newTasks.forEach((task, index) => {
      task.order = index;
    });
    
    setTasks(newTasks);
  };

  const handleAnalyzeFlow = async () => {
    if (tasks.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // Create a temporary flow object for the current tasks
      const currentFlow = {
        id: 'temp-flow',
        name: 'Current Analysis',
        tasks: [...tasks],
        order: flows.length,
        isAnalyzing: true
      };

      // Combine existing flows with current flow
      const allFlows = [
        ...flows,
        currentFlow
      ];

      console.log('Analyzing flows:', JSON.stringify({
        startUrl,
        flows: allFlows,
        currentFlow
      }, null, 2));

      // Send both startUrl and all flows including current one
      const elements = await analyzeFlow(startUrl, allFlows, tasks);
      
      // Store the analyzed elements and tasks
      setAnalyzedElements({
        elements,
        tasks: [...tasks]
      });

      // Add the analysis results to store for temporary viewing
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
            newTasks: tasks.length
          }
        }
      });

      // Clear current selections
      setLocalSelectedElements([]);
      
      // Force a re-parse of elements
      parseElements();

      // Show name input for the new flow
      setShowNameInput(true);

    } catch (error) {
      console.error('Flow analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateFlow = () => {
    if (!analyzedElements || !flowName.trim()) return;

    // Create new flow with metadata
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

    // Notify parent about new flow
    onFlowCreated(newFlow);

    // Update the analysis results with the proper flow ID
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

    // Reset states
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
      // Handle selection locally for flows
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
      // Use the provided onElementSelect for initial URL analysis
      onElementSelect(element);
    }
  };

  const isSelected = (selector: string, type: 'id' | 'class' | 'tag') => {
    return effectiveSelectedElements.some(e => e.selector === selector && e.type === type);
  };

  return (
    <div className="space-y-4">
      {flows.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium mb-4">Created Flows</h3>
          <div className="space-y-2">
            {flows.map((flow, index) => (
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

      {effectiveElements && (
        <div className="bg-white rounded-lg border border-gray-200">
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

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTab === 'ids'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedTab('ids')}
              >
                IDs ({effectiveElements.ids.size})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTab === 'classes'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedTab('classes')}
              >
                Classes ({effectiveElements.classes.size})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTab === 'tags'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedTab('tags')}
              >
                Tags ({effectiveElements.tags.size})
              </button>
            </nav>
          </div>

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
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {`<${info.examples[0].tag}${info.examples[0].id ? ` id="${info.examples[0].id}"` : ''}${
                            info.examples[0].class ? ` class="${info.examples[0].class.join(' ')}"` : ''
                          }>${info.examples[0].tag === 'img' ? '' : '...'}</${info.examples[0].tag}>`}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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

      {effectiveSelectedElements.length > 0 && filteredRawElements.length > 0 && (
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
          <ElementSummary 
            elements={filteredRawElements} 
            onAddAction={handleAddAction}
          />
        </div>
      )}
    </div>
  );
};
