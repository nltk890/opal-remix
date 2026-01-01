import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData } from '../../types';
import { processorRegistry, DATE_FORMATS, INVALID_DATE_MODES } from '../../lib/processor-registry';

export const ProcessorNode: React.FC<{ data: NodeData; id: string }> = ({ data, id }) => {
  const processor = data.processorId ? processorRegistry[data.processorId] : null;
  const [activeTab, setActiveTab] = useState<'form' | 'code'>(data.userMode === 'Code' ? 'code' : 'form');

  // Sync tab with mode if user didn't manually toggle
  const displayTab = data.userMode === 'Code' ? activeTab : 'form';

  const handleConfigUpdate = (key: string, value: any) => {
    if (data.onConfigChange) {
      data.onConfigChange({ ...data.config, [key]: value });
    }
  };

  const handleToggleColumn = (col: string) => {
    const current = data.config?.columns || [];
    const next = current.includes(col) 
      ? current.filter((c: string) => c !== col)
      : [...current, col];
    handleConfigUpdate('columns', next);
  };

  return (
    <div className={`bg-white border-2 rounded-xl shadow-lg w-80 overflow-hidden transition-all duration-300 ${
      data.status === 'running' ? 'border-blue-400 shadow-blue-100 scale-[1.02]' : 
      data.status === 'error' ? 'border-red-400' : 'border-slate-200'
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 border-2 border-white bg-slate-400" />
      
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            data.status === 'running' ? 'bg-blue-500 animate-pulse' : 
            data.status === 'success' ? 'bg-green-500' : 
            data.status === 'error' ? 'bg-red-500' : 'bg-slate-300'
          }`} />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{processor?.label || 'Node'}</span>
        </div>
        
        {data.userMode === 'Code' && (
          <div className="flex bg-slate-200 p-0.5 rounded-md text-[9px]">
            <button 
              onClick={() => setActiveTab('form')}
              className={`px-1.5 py-0.5 rounded ${activeTab === 'form' ? 'bg-white shadow-sm font-bold' : 'text-slate-500'}`}
            >UI</button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-1.5 py-0.5 rounded ${activeTab === 'code' ? 'bg-white shadow-sm font-bold' : 'text-slate-500'}`}
            >JS</button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {displayTab === 'form' ? (
          <div className="space-y-4">
             {/* Configuration Form */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Target Columns</label>
              <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                {data.metadata?.columns?.map(col => (
                  <label key={col} className="flex items-center space-x-2 text-xs text-slate-600 hover:bg-white p-1 rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={data.config?.columns?.includes(col) || false}
                      onChange={() => handleToggleColumn(col)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
                {!data.metadata?.columns?.length && <p className="text-[10px] text-slate-400 italic">Connect input for columns...</p>}
              </div>
            </div>

            {processor?.id === 'date-cleaner' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Format</label>
                  <select 
                    value={data.config?.targetFormat || 'DD-MM-YYYY'}
                    onChange={(e) => handleConfigUpdate('targetFormat', e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                  >
                    {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">On Fail</label>
                  <select 
                    value={data.config?.invalidMode || 'warning'}
                    onChange={(e) => handleConfigUpdate('invalidMode', e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                  >
                    {INVALID_DATE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            )}
            {processor?.id === 'salary-formatter' && (
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Decimals</label>
                 <input 
                    type="number"
                    value={data.config?.decimalPlaces || 2}
                    onChange={(e) => handleConfigUpdate('decimalPlaces', parseInt(e.target.value))}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded"
                 />
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-slate-900 rounded-lg p-3 overflow-hidden border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] text-slate-500 font-mono">config.json</span>
              </div>
              <pre className="text-[10px] text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(data.config, null, 2)}
              </pre>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Internal Logic</span>
              <p className="text-[10px] text-slate-600 leading-relaxed italic">
                Deterministic transformation of <span className="font-bold text-blue-600">{(data.config?.columns?.length || 0)}</span> columns 
                using <span className="font-bold">{processor?.id}</span> strategy. Executes in background thread.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex-1 overflow-hidden">
             {data.status === 'success' && <p className="text-[10px] text-green-600 font-bold">● SUCCESS</p>}
             {data.status === 'error' && <p className="text-[10px] text-red-600 font-bold">● ERROR</p>}
          </div>
          <button 
            onClick={() => data.onRun && data.onRun()}
            disabled={data.status === 'running' || !data.metadata?.columns}
            className={`px-4 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all flex items-center space-x-2 ${
              data.status === 'running' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
              'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {data.status === 'running' ? 'RUNNING...' : 'RUN STEP'}
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 border-2 border-white bg-slate-400" />
    </div>
  );
};
