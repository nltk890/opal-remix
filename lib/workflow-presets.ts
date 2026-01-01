export const WORKFLOW_PRESETS = [
  {
    id: 'basic-cleanup',
    name: 'Basic Data Cleanup',
    description: 'A standard flow for cleaning dates and normalizing headers.',
    nodes: [
      {
        id: 'proc-1',
        type: 'processorNode',
        position: { x: 450, y: 150 },
        data: { 
          label: 'Date Cleaning', 
          status: 'idle', 
          logs: [], 
          processorId: 'date-cleaner',
          config: { columns: [], targetFormat: 'DD-MM-YYYY', invalidMode: 'warning' }
        },
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'proc-1', animated: true },
      { id: 'e2-3', source: 'proc-1', target: 'output-1', animated: true },
    ]
  },
  {
    id: 'payroll-std',
    name: 'Payroll Standardization',
    description: 'Double processing for dates and salary normalization.',
    nodes: [
      {
        id: 'proc-1',
        type: 'processorNode',
        position: { x: 400, y: 100 },
        data: { 
          label: 'Date Cleaning', 
          status: 'idle', 
          logs: [], 
          processorId: 'date-cleaner',
          config: { columns: [], targetFormat: 'DD-MM-YYYY', invalidMode: 'warning' }
        },
      },
      {
        id: 'proc-2',
        type: 'processorNode',
        position: { x: 400, y: 300 },
        data: { 
          label: 'Salary Normalization', 
          status: 'idle', 
          logs: [], 
          processorId: 'salary-formatter',
          config: { columns: [], decimalPlaces: 2 }
        },
      }
    ],
    edges: [
      { id: 'e1-p1', source: 'input-1', target: 'proc-1', animated: true },
      { id: 'p1-p2', source: 'proc-1', target: 'proc-2', animated: true },
      { id: 'p2-o1', source: 'proc-2', target: 'output-1', animated: true },
    ]
  }
];