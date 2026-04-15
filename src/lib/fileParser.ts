import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const parseFile = async (file: File): Promise<{ csv: string, format: string }> => {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.csv')) {
    const text = await file.text();
    return { csv: text, format: 'CSV' };
  } 
  
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return { csv, format: 'Excel' };
  }
  
  if (name.endsWith('.json')) {
    const text = await file.text();
    try {
      let data = JSON.parse(text);
      // Auto-flatten if it's an object with a single array property
      if (!Array.isArray(data) && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 1 && Array.isArray(data[keys[0]])) {
          data = data[keys[0]];
        }
      }
      
      if (Array.isArray(data)) {
        const csv = Papa.unparse(data);
        return { csv, format: 'JSON' };
      }
      throw new Error("JSON must be an array of objects");
    } catch (e) {
      throw new Error("Failed to parse JSON: " + (e as Error).message);
    }
  }
  
  if (name.endsWith('.txt') || name.endsWith('.tsv')) {
    const text = await file.text();
    // Papa parse can auto-detect delimiter
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const csv = Papa.unparse(parsed.data);
    return { csv, format: 'Text' };
  }

  throw new Error("Unsupported file format");
};
