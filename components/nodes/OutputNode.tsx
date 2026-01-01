
import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData } from '../../types';

export const OutputNode: React.FC<{ data: NodeData; id: string }> = ({ data, id }) => {
  const isReady = data.metadata?.rowCount !== undefined;

  return (
    <div className={`bg-white border-2 border-slate-200 rounded-xl shadow-sm w-72 overflow-hidden transition-all ${
      isReady ? 'border-green-200 shadow-green-50' : ''
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 border-2 border-white bg-slate-400" />
      
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Output</span>
        <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
      </div>

      <div className="p-4 space-y-4">
        {!isReady ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg text-slate-400">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[10px] uppercase font-bold text-center">Locked</p>
            <p className="text-[10px] text-center italic">Run pipeline steps to enable export</p>
          </div>
        ) : (
          <div className="space-y-3">
             <div className="bg-green-50 p-3 rounded-lg border border-green-100">
               <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Success</p>
               <p className="text-xs text-green-800 leading-tight">Data transformation complete. Ready for secure export.</p>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => data.onRun && data.onRun('xlsx')}
                  className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-green-700 uppercase">Excel</span>
                </button>
                <button 
                  onClick={() => data.onRun && data.onRun('csv')}
                  className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700 uppercase">CSV</span>
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
