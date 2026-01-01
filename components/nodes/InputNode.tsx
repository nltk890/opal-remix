
import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData } from '../../types';

export const InputNode: React.FC<{ data: NodeData; id: string }> = ({ data, id }) => {
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && data.onConfigChange) {
      data.onConfigChange({ file });
    }
  }, [data]);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm w-72 overflow-hidden hover:border-blue-400 transition-colors">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Source</span>
        <div className={`w-2 h-2 rounded-full ${data.status === 'success' ? 'bg-green-500' : 'bg-slate-300'}`} />
      </div>
      
      <div className="p-4 space-y-4">
        {!data.metadata?.fileName ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={onFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs text-slate-500 text-center font-medium">Click or drag Excel/CSV</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{data.metadata.fileName}</p>
                <p className="text-[10px] text-slate-500">{data.metadata.rowCount} rows detected</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
               <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Columns</p>
               <div className="flex flex-wrap gap-1">
                 {data.metadata.columns?.slice(0, 4).map(col => (
                   <span key={col} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200 truncate max-w-[80px]">
                     {col}
                   </span>
                 ))}
                 {(data.metadata.columns?.length || 0) > 4 && (
                   <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">+{data.metadata.columns!.length - 4} more</span>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 border-2 border-white bg-slate-400 hover:bg-blue-500 transition-colors" />
    </div>
  );
};
