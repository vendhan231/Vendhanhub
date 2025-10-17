import * as XLSX from 'xlsx';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export interface ExtractedData {
  [key: string]: any;
}

export const extractDataFromCSV = (buffer: Buffer): Promise<ExtractedData[]> => {
  return new Promise((resolve, reject) => {
    const results: ExtractedData[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csvParser())
      .on('data', (data: ExtractedData) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

export const extractDataFromXLSX = (buffer: Buffer): ExtractedData[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

export const extractDataFromFile = async (buffer: Buffer, mimeType: string): Promise<ExtractedData[]> => {
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return await extractDataFromCSV(buffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
             mimeType === 'application/vnd.ms-excel') {
    return extractDataFromXLSX(buffer);
  } else {
    throw new Error('Unsupported file type');
  }
};

export const mapFieldsToProject = (
  extractedData: ExtractedData[],
  projectFieldConfig: {
    report_level: Array<{ label: string; type: string; unique?: boolean; required?: boolean }>;
    item_level: Array<{ label: string; type: string; unique?: boolean; required?: boolean }>;
  }
): { reportData: Record<string, any>; items: Array<Record<string, any>> } => {
  if (extractedData.length === 0) return { reportData: {}, items: [] };

  // Assume first row contains report-level data
  const reportData: Record<string, any> = {};
  const items: Array<Record<string, any>> = [];

  // Map report-level fields (case-insensitive)
  const reportLevelFields = projectFieldConfig.report_level;
  const itemLevelFields = projectFieldConfig.item_level;

  for (const row of extractedData) {
    const item: Record<string, any> = {};

    // Check if this row has item-level data
    let hasItemData = false;

    for (const field of itemLevelFields) {
      const fieldValue = findFieldValue(row, field.label);
      if (fieldValue !== undefined && fieldValue !== '') {
        item[field.label] = fieldValue;
        hasItemData = true;
      }
    }

    if (hasItemData) {
      items.push(item);
    } else {
      // This might be report-level data
      for (const field of reportLevelFields) {
        const fieldValue = findFieldValue(row, field.label);
        if (fieldValue !== undefined) {
          reportData[field.label] = fieldValue;
        }
      }
    }
  }

  return { reportData, items };
};

const findFieldValue = (row: ExtractedData, fieldLabel: string): any => {
  // Case-insensitive field matching
  const keys = Object.keys(row);
  const matchingKey = keys.find(key => key.toLowerCase() === fieldLabel.toLowerCase());
  return matchingKey ? row[matchingKey] : undefined;
};