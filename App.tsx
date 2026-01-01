
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from 'reactflow';

import { InputNode } from './components/nodes/InputNode';
import { ProcessorNode } from './components/nodes/ProcessorNode';
import { OutputNode } from './components/nodes/OutputNode';
import { NodeData, WorkerMessage, UserMode, WorkflowExport } from './types';
import { WORKFLOW_PRESETS } from './lib/workflow-presets';

const nodeTypes = {
  inputNode: InputNode,
  processorNode: ProcessorNode,
  outputNode: OutputNode,
};

const defaultInput: Node<NodeData> = {
  id: 'input-1',
  type: 'inputNode',
  position: { x: 50, y: 150 },
  data: { label: 'Source File', status: 'idle', logs: [] },
};

const defaultOutput: Node<NodeData> = {
  id: 'output-1',
  type: 'outputNode',
  position: { x: 850, y: 150 },
  data: { label: 'Final Data', status: 'idle', logs: [] },
};

export default function App() {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([defaultInput, defaultOutput]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [mode, setMode] = useState<UserMode>('UI');
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.min.js');
      importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      
      let currentDf = null;

      self.onmessage = async (e) => {
        const { type, payload } = e.data;
        try {
          if (type === 'INIT_FILE') {
            const workbook = XLSX.read(payload.fileBuffer, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            currentDf = new dfd.DataFrame(json);
            self.postMessage({ 
              type: 'SUCCESS', 
              payload: { 
                nodeId: payload.nodeId, 
                metadata: { 
                  fileName: payload.fileName, 
                  rowCount: currentDf.shape[0], 
                  columns: currentDf.columns 
                } 
              } 
            });
          } else if (type === 'RUN_STEP') {
            if (!currentDf) throw new Error("No data loaded.");
            
            const { processorId, config } = payload;
            const targetCols = config.columns || [];
            
            if (processorId === 'date-cleaner') {
              const { targetFormat, invalidMode } = config;
              targetCols.forEach(col => {
                const s = currentDf[col];
                const cleaned = s.map(v => {
                  if (!v) return null;
                  const d = new Date(v);
                  if (isNaN(d.getTime())) {
                    return invalidMode === 'null' ? null : v;
                  }
                  
                  const dd = String(d.getDate()).padStart(2, '0');
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const yyyy = d.getFullYear();
                  
                  if (targetFormat === 'MM-DD-YYYY') return \`\${mm}-\${dd}-\${yyyy}\`;
                  if (targetFormat === 'YYYY-MM-DD') return \`\${yyyy}-\${mm}-\${dd}\`;
                  if (targetFormat === 'DD/MM/YYYY') return \`\${dd}/\${mm}/\${yyyy}\`;
                  return \`\${dd}-\${mm}-\${yyyy}\`; // Default DD-MM-YYYY
                });
                currentDf.addColumn(col, cleaned, { atIndex: currentDf.columns.indexOf(col), replace: true });
              });
            } else if (processorId === 'salary-formatter') {
              const decimals = config.decimalPlaces ?? 2;
              targetCols.forEach(col => {
                const s = currentDf[col];
                const cleaned = s.map(v => {
                  if (v === null || v === undefined) return 0;
                  const num = parseFloat(String(v).replace(/[^0-9.-]+/g, ""));
                  return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
                });
                currentDf.addColumn(col, cleaned, { atIndex: currentDf.columns.indexOf(col), replace: true });
              });
            }
            
            self.postMessage({ 
              type: 'SUCCESS', 
              payload: { 
                nodeId: payload.nodeId, 
                metadata: { 
                  rowCount: currentDf.shape[0], 
                  columns: currentDf.columns 
                } 
              } 
            });
          } else if (type === 'EXPORT_FILE') {
            const jsonData = dfd.toJSON(currentDf);
            const ws = XLSX.utils.json_to_sheet(jsonData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Result");
            const out = XLSX.write(wb, { type: 'array', bookType: payload.format });
            self.postMessage({ 
              type: 'SUCCESS', 
              payload: { 
                nodeId: payload.nodeId, 
                blob: out, 
                format: payload.format 
              } 
            });
          }
        } catch(err) { 
          self.postMessage({ 
            type: 'ERROR', 
            payload: { nodeId: payload?.nodeId, message: err.message } 
          }); 
        }
      };
    `;
    
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, payload } = e.data;
      if (type === 'SUCCESS') {
        if (payload.blob) {
          const blob = new Blob([payload.blob], { 
            type: payload.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `output_${Date.now()}.${payload.format}`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }

        setNodes(nds => nds.map(node => {
          if (node.id === payload.nodeId) {
            return { ...node, data: { ...node.data, status: 'success', metadata: payload.metadata } };
          }
          const isTarget = edges.some(e => e.source === payload.nodeId && e.target === node.id);
          if (isTarget) {
             return { ...node, data: { ...node.data, metadata: payload.metadata } };
          }
          return node;
        }));
      }

      if (type === 'ERROR') {
        setNodes(nds => nds.map(node => 
          node.id === payload.nodeId ? { ...node, data: { ...node.data, status: 'error' } } : node
        ));
        console.error('Worker Error:', payload.message);
      }
    };

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [edges]);

  // Handlers
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onNodeConfigChange = useCallback((id: string, config: any) => {
    if (config.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        workerRef.current?.postMessage({
          type: 'INIT_FILE',
          payload: { nodeId: id, fileName: config.file.name, fileBuffer: e.target?.result }
        });
      };
      reader.readAsArrayBuffer(config.file);
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'running' } } : n));
    } else {
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, config } } : n));
    }
  }, []);

  const onNodeRun = useCallback((id: string, action?: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    if (node.type === 'outputNode') {
      workerRef.current?.postMessage({ type: 'EXPORT_FILE', payload: { nodeId: id, format: action || 'xlsx' } });
      return;
    }
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'running' } } : n));
    workerRef.current?.postMessage({ type: 'RUN_STEP', payload: { nodeId: id, processorId: node.data.processorId, config: node.data.config } });
  }, [nodes]);

  const exportWorkflow = () => {
    const workflow: WorkflowExport = {
      name: `Workflow-${Date.now()}`,
      version: '1.0',
      nodes: nodes.filter(n => n.type === 'processorNode'),
      edges: edges
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opal_workflow_${Date.now()}.json`;
    a.click();
  };

  const importWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const flow: WorkflowExport = JSON.parse(ev.target?.result as string);
        loadWorkflow(flow);
      } catch (err) {
        alert("Invalid workflow file.");
      }
    };
    reader.readAsText(file);
  };

  const loadWorkflow = (flow: any) => {
    setNodes([
      { ...defaultInput, data: { ...defaultInput.data, status: 'idle' } },
      ...flow.nodes.map((n: any) => ({ ...n, data: { ...n.data, status: 'idle', metadata: undefined } })),
      { ...defaultOutput, data: { ...defaultOutput.data, status: 'idle' } }
    ]);
    setEdges(flow.edges);
  };

  const processedNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: { 
      ...n.data, 
      userMode: mode,
      onRun: (action?: string) => onNodeRun(n.id, action),
      onConfigChange: (config: any) => onNodeConfigChange(n.id, config) 
    }
  })), [nodes, mode, onNodeRun, onNodeConfigChange]);

  return (
    <div className="w-screen h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Opal Pipeline</h1>
          </div>

          <div className="h-8 w-[1px] bg-slate-200" />

          <div className="flex items-center space-x-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow</label>
            <select 
              onChange={(e) => {
                const preset = WORKFLOW_PRESETS.find(p => p.id === e.target.value);
                if (preset) loadWorkflow(preset);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Select Preset...</option>
              {WORKFLOW_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button 
              onClick={() => setMode('UI')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'UI' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              UI View
            </button>
            <button 
              onClick={() => setMode('Code')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'Code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Code View
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-200" />

          <div className="flex items-center space-x-2">
            <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
              Import
              <input type="file" accept=".json" onChange={importWorkflow} className="hidden" />
            </label>
            <button 
              onClick={exportWorkflow}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <ReactFlow
          nodes={processedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
        </ReactFlow>
      </main>

      <footer className="h-8 bg-slate-900 flex items-center justify-between px-6 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Secure Worker Context</span>
          </div>
          <span className="text-slate-600">|</span>
          <span>{nodes.length} Active Nodes</span>
        </div>
        <div>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 uppercase tracking-widest font-black">
            Devansh Mistry | Deterministic Engine v2
          </span>
        </div>
      </footer>
    </div>
  );
}
