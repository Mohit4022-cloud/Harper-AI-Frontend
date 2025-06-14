/**
 * CSV Parser Utility
 * 
 * Handles CSV parsing and mapping for contact imports
 * Features:
 * - Parse CSV string to objects
 * - Custom field mapping
 * - Data validation
 * - Error handling
 */

import { parse } from 'csv-parse/sync';

interface CSVContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  company?: string;
  department?: string;
  linkedin?: string;
  twitter?: string;
  leadSource?: string;
  customFields?: Record<string, any>;
}

interface CSVMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  company?: string;
  department?: string;
  linkedin?: string;
  twitter?: string;
  leadSource?: string;
  [key: string]: string | undefined;
}

/**
 * Parse CSV string and map to contact objects
 */
export async function parseCSV(
  csvData: string,
  mapping?: Record<string, string>
): Promise<CSVContact[]> {
  try {
    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Try to parse JSON values for custom fields
        if (value && value.startsWith('{') && value.endsWith('}')) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      },
    });

    if (!records || records.length === 0) {
      throw new Error('No data found in CSV');
    }

    // Get column names from first record
    const columns = Object.keys(records[0]);
    
    // Default mapping if not provided
    const fieldMapping: CSVMapping = mapping as CSVMapping || {
      email: findColumn(columns, ['email', 'email_address', 'e-mail']),
      firstName: findColumn(columns, ['first_name', 'firstname', 'fname']),
      lastName: findColumn(columns, ['last_name', 'lastname', 'lname']),
      phone: findColumn(columns, ['phone', 'phone_number', 'mobile']),
      title: findColumn(columns, ['title', 'job_title', 'position']),
      company: findColumn(columns, ['company', 'company_name', 'organization']),
      department: findColumn(columns, ['department', 'dept']),
      linkedin: findColumn(columns, ['linkedin', 'linkedin_url']),
      twitter: findColumn(columns, ['twitter', 'twitter_handle']),
      leadSource: findColumn(columns, ['lead_source', 'source']),
    };

    // Validate required fields
    if (!fieldMapping.email) {
      throw new Error('Email column is required in CSV');
    }

    // Map records to contacts
    const contacts: CSVContact[] = [];
    const errors: string[] = [];

    records.forEach((record: any, index: number) => {
      try {
        const email = record[fieldMapping.email];
        
        if (!email || !isValidEmail(email)) {
          errors.push(`Row ${index + 2}: Invalid or missing email`);
          return;
        }

        const contact: CSVContact = {
          email: email.toLowerCase(),
          firstName: record[fieldMapping.firstName!] || undefined,
          lastName: record[fieldMapping.lastName!] || undefined,
          phone: record[fieldMapping.phone!] || undefined,
          title: record[fieldMapping.title!] || undefined,
          company: record[fieldMapping.company!] || undefined,
          department: record[fieldMapping.department!] || undefined,
          linkedin: record[fieldMapping.linkedin!] || undefined,
          twitter: record[fieldMapping.twitter!] || undefined,
          leadSource: record[fieldMapping.leadSource!] || 'CSV Import',
          customFields: {},
        };

        // Add any unmapped fields to customFields
        Object.keys(record).forEach(key => {
          if (!Object.values(fieldMapping).includes(key)) {
            contact.customFields![key] = record[key];
          }
        });

        // Clean up empty values
        Object.keys(contact).forEach(key => {
          if (contact[key as keyof CSVContact] === '' || 
              contact[key as keyof CSVContact] === null) {
            delete contact[key as keyof CSVContact];
          }
        });

        contacts.push(contact);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0 && contacts.length === 0) {
      throw new Error(`CSV parsing failed:\n${errors.join('\n')}`);
    }

    return contacts;
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw error;
  }
}

/**
 * Find column name from possible variations
 */
function findColumn(columns: string[], variations: string[]): string {
  const normalizedColumns = columns.map(col => col.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  for (const variation of variations) {
    const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
    const index = normalizedColumns.findIndex(col => col === normalizedVariation);
    
    if (index !== -1) {
      return columns[index];
    }
  }
  
  return '';
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate CSV from contacts
 */
export function generateCSV(contacts: any[]): string {
  if (!contacts || contacts.length === 0) {
    return '';
  }

  // Get all unique keys from contacts
  const allKeys = new Set<string>();
  contacts.forEach(contact => {
    Object.keys(contact).forEach(key => {
      if (key !== 'customFields') {
        allKeys.add(key);
      }
    });
    
    // Add custom field keys
    if (contact.customFields && typeof contact.customFields === 'object') {
      Object.keys(contact.customFields).forEach(key => {
        allKeys.add(`custom_${key}`);
      });
    }
  });

  // Create header
  const headers = Array.from(allKeys);
  const csvRows = [headers.join(',')];

  // Add data rows
  contacts.forEach(contact => {
    const row = headers.map(header => {
      let value;
      
      if (header.startsWith('custom_')) {
        const customKey = header.substring(7);
        value = contact.customFields?.[customKey] || '';
      } else {
        value = contact[header] || '';
      }

      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });
    
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Validate CSV structure
 */
export function validateCSVStructure(csvData: string): {
  isValid: boolean;
  headers: string[];
  rowCount: number;
  errors: string[];
} {
  try {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      to_line: 10, // Only parse first 10 lines for validation
    });

    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    const hasEmail = headers.some(h => 
      h.toLowerCase().includes('email') || 
      h.toLowerCase() === 'e-mail'
    );

    const errors: string[] = [];
    
    if (!hasEmail) {
      errors.push('CSV must contain an email column');
    }

    if (records.length === 0) {
      errors.push('CSV contains no data rows');
    }

    return {
      isValid: errors.length === 0,
      headers,
      rowCount: records.length,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      headers: [],
      rowCount: 0,
      errors: [error instanceof Error ? error.message : 'Invalid CSV format'],
    };
  }
}