import * as XLSX from 'xlsx';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export interface ProcessedFileData {
  fileName: string;
  objectIds: string[];
  extractedFields: Record<string, any>[];
  duplicates: string[];
  totalRecords: number;
  errors?: string[];
}

export interface FileProcessingResult {
  success: boolean;
  data?: ProcessedFileData;
  error?: string;
}

export class FileProcessor {
  static async processCSV(file: any): Promise<FileProcessingResult> {
    try {
      const results: Record<string, any>[] = [];
      const objectIds: string[] = [];
      const duplicates: string[] = [];

      // Convert buffer to readable stream
      const stream = Readable.from(file.buffer);

      return new Promise((resolve) => {
        stream
          .pipe(csvParser())
          .on('data', (data: Record<string, any>) => {
            results.push(data);

            // Extract Object_ID if it exists
            if (data.Object_ID || data.object_id || data.OBJECT_ID) {
              const objectId = data.Object_ID || data.object_id || data.OBJECT_ID;
              objectIds.push(objectId);

              // Check for duplicates
              if (objectIds.filter(id => id === objectId).length > 1) {
                if (!duplicates.includes(objectId)) {
                  duplicates.push(objectId);
                }
              }
            }
          })
          .on('end', () => {
            resolve({
              success: true,
              data: {
                fileName: file.originalname,
                objectIds: [...new Set(objectIds)],
                extractedFields: results,
                duplicates,
                totalRecords: results.length,
              }
            });
          })
          .on('error', (error: Error) => {
            resolve({
              success: false,
              error: `CSV processing error: ${error.message}`
            });
          });
      });
    } catch (error) {
      return {
        success: false,
        error: `File processing failed: ${(error as Error).message}`
      };
    }
  }

  static async processExcel(file: any): Promise<FileProcessingResult> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        return {
          success: false,
          error: 'Excel file must contain at least a header row and one data row'
        };
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const results: Record<string, any>[] = [];
      const objectIds: string[] = [];
      const duplicates: string[] = [];

      // Process each row
      rows.forEach((row, index) => {
        const rowData: Record<string, any> = {};

        headers.forEach((header, colIndex) => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          rowData[normalizedHeader] = row[colIndex];

          // Extract Object_ID
          if (normalizedHeader.includes('object_id') || header.toLowerCase().includes('object_id')) {
            const objectId = row[colIndex];
            if (objectId) {
              objectIds.push(objectId);

              // Check for duplicates
              if (objectIds.filter(id => id === objectId).length > 1) {
                if (!duplicates.includes(objectId)) {
                  duplicates.push(objectId);
                }
              }
            }
          }
        });

        results.push(rowData);
      });

      return {
        success: true,
        data: {
          fileName: file.originalname,
          objectIds: [...new Set(objectIds)],
          extractedFields: results,
          duplicates,
          totalRecords: results.length,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Excel processing error: ${(error as Error).message}`
      };
    }
  }

  static async processJSON(file: any): Promise<FileProcessingResult> {
    try {
      const jsonContent = file.buffer.toString('utf-8');
      const data = JSON.parse(jsonContent);

      const results: Record<string, any>[] = [];
      const objectIds: string[] = [];
      const duplicates: string[] = [];

      // Handle both array of objects and single object
      const items = Array.isArray(data) ? data : [data];

      items.forEach((item, index) => {
        results.push(item);

        // Extract Object_ID
        const objectId = item.Object_ID || item.object_id || item.OBJECT_ID;
        if (objectId) {
          objectIds.push(objectId);

          // Check for duplicates
          if (objectIds.filter(id => id === objectId).length > 1) {
            if (!duplicates.includes(objectId)) {
              duplicates.push(objectId);
            }
          }
        }
      });

      return {
        success: true,
        data: {
          fileName: file.originalname,
          objectIds: [...new Set(objectIds)],
          extractedFields: results,
          duplicates,
          totalRecords: results.length,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON processing error: ${(error as Error).message}`
      };
    }
  }

  static async processFile(file: any): Promise<FileProcessingResult> {
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'csv':
        return this.processCSV(file);
      case 'xlsx':
      case 'xls':
        return this.processExcel(file);
      case 'json':
        return this.processJSON(file);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}`
        };
    }
  }

  static detectDuplicates(objectIds: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    objectIds.forEach(id => {
      if (seen.has(id)) {
        duplicates.add(id);
      } else {
        seen.add(id);
      }
    });

    return Array.from(duplicates);
  }

  static validateObjectId(objectId: string): boolean {
    // Basic validation - can be enhanced based on requirements
    return Boolean(objectId && objectId.trim().length > 0);
  }

  static sanitizeObjectId(objectId: string): string {
    return objectId.trim().toUpperCase();
  }
}