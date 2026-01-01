
/* eslint-disable no-restricted-globals */
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';

let currentDf: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'INIT_FILE': {
        const { fileBuffer, fileName } = payload;
        const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        currentDf = new dfd.DataFrame(jsonData);
        
        self.postMessage({
          type: 'SUCCESS',
          payload: {
            nodeId: payload.nodeId,
            metadata: {
              fileName,
              rowCount: currentDf.shape[0],
              columns: currentDf.columns,
            }
          }
        });
        break;
      }

      case 'RUN_STEP': {
        const { nodeId, processorId, config } = payload;
        
        if (!currentDf) throw new Error("No data loaded in worker.");

        const targetCols = config.columns || [];

        if (processorId === 'date-cleaner') {
          const { targetFormat, invalidMode } = config;
          
          targetCols.forEach((col: string) => {
            const series = currentDf[col];
            const cleaned = series.map((val: any) => {
              if (!val) return null;
              
              const dateObj = new Date(val);
              if (isNaN(dateObj.getTime())) {
                return invalidMode === 'null' ? null : val;
              }
              
              const d = dateObj.getDate().toString().padStart(2, '0');
              const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const y = dateObj.getFullYear();
              
              if (targetFormat === 'MM-DD-YYYY') return `${m}-${d}-${y}`;
              if (targetFormat === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
              if (targetFormat === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
              return `${d}-${m}-${y}`; // Default DD-MM-YYYY
            });
            
            currentDf.addColumn(col, cleaned, { atIndex: currentDf.columns.indexOf(col), replace: true });
          });
        } else if (processorId === 'salary-formatter') {
          const decimals = config.decimalPlaces ?? 2;
          
          targetCols.forEach((col: string) => {
            const series = currentDf[col];
            const cleaned = series.map((val: any) => {
              if (val === null || val === undefined) return 0;
              // Remove symbols and handle as number
              const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
              return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
            });
            currentDf.addColumn(col, cleaned, { atIndex: currentDf.columns.indexOf(col), replace: true });
          });
        }

        self.postMessage({
          type: 'SUCCESS',
          payload: {
            nodeId,
            metadata: {
              rowCount: currentDf.shape[0],
              columns: currentDf.columns,
            },
            logs: [{ type: 'info', message: 'Processing complete', timestamp: Date.now() }]
          }
        });
        break;
      }

      case 'EXPORT_FILE': {
        const { format } = payload;
        if (!currentDf) throw new Error("No data to export.");

        const jsonData = dfd.toJSON(currentDf);
        const ws = XLSX.utils.json_to_sheet(jsonData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ProcessedData");
        
        const wbout = XLSX.write(wb, { 
            bookType: format === 'xlsx' ? 'xlsx' : 'csv', 
            type: 'array' 
        });

        self.postMessage({
          type: 'SUCCESS',
          payload: {
            nodeId: payload.nodeId,
            blob: wbout,
            format
          }
        });
        break;
      }
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        nodeId: payload?.nodeId,
        message: error.message
      }
    });
  }
};
