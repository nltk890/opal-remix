import { z } from 'zod';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';
export type UserMode = 'UI' | 'Code';

export interface ProcessorLog {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface NodeData {
  label: string;
  status: NodeStatus;
  logs: ProcessorLog[];
  config?: any;
  userMode?: UserMode; // Passed down to nodes
  metadata?: {
    fileName?: string;
    rowCount?: number;
    columns?: string[];
    encoding?: string;
  };
  processorId?: string;
  onRun?: (action?: string) => void;
  onConfigChange?: (config: any) => void;
}

export interface WorkflowExport {
  name: string;
  version: string;
  nodes: any[];
  edges: any[];
}

export interface ProcessorDefinition {
  id: string;
  label: string;
  description: string;
  configSchema: z.ZodObject<any>;
  run: (df: any, config: any) => Promise<{ df: any; logs: ProcessorLog[] }>;
}

export type WorkerMessageType = 
  | 'INIT_FILE' 
  | 'RUN_STEP' 
  | 'EXPORT_FILE' 
  | 'PROGRESS' 
  | 'SUCCESS' 
  | 'ERROR';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: any;
}