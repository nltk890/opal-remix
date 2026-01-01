
import { z } from 'zod';
import { ProcessorDefinition, ProcessorLog } from '../types';

/**
 * Note: Actual DataFrame operations happen inside the Web Worker.
 * This registry is shared for UI schema generation and metadata.
 */

export const DATE_FORMATS = [
  { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
  { label: 'MM-DD-YYYY', value: 'MM-DD-YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
];

export const INVALID_DATE_MODES = [
  { label: 'Keep Original', value: 'keep' },
  { label: 'Set to Null', value: 'null' },
  { label: 'Flag Warning', value: 'warning' },
];

export const processorRegistry: Record<string, ProcessorDefinition> = {
  'date-cleaner': {
    id: 'date-cleaner',
    label: 'Date Cleaning',
    description: 'Standardizes mixed date formats into a deterministic output.',
    configSchema: z.object({
      columns: z.array(z.string()).min(1, "Select at least one column"),
      targetFormat: z.string().default('DD-MM-YYYY'),
      invalidMode: z.enum(['keep', 'null', 'warning']).default('warning'),
    }),
    run: async (df: any, config: any) => {
       // This is a placeholder for the UI-side definition. 
       // The actual logic is implemented in the worker for performance.
       return { df, logs: [] };
    }
  },
  'salary-formatter': {
    id: 'salary-formatter',
    label: 'Salary Normalization',
    description: 'Ensures currency values are numeric and correctly scaled.',
    configSchema: z.object({
      columns: z.array(z.string()).min(1),
      decimalPlaces: z.number().default(2),
    }),
    run: async (df: any, config: any) => {
       return { df, logs: [] };
    }
  }
};
