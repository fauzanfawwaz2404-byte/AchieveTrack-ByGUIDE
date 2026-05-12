/**
 * Utility to extract date from Lab Number (YYMMDDXXXX)
 * Returns ISO string (YYYY-MM-DDT12:00:00) to avoid timezone shifts
 */
export function extractDateFromLabNo(noLab: string): string | null {
  if (!noLab || noLab.length < 6) return null;
  
  const yy = noLab.substring(0, 2);
  const mm = noLab.substring(2, 4);
  const dd = noLab.substring(4, 6);
  
  const year = 2000 + parseInt(yy, 10);
  const month = parseInt(mm, 10) - 1; // 0-indexed
  const day = parseInt(dd, 10);
  
  const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid day shifts
  
  // Validate if it's a real date
  if (
    date.getFullYear() === year && 
    date.getMonth() === month && 
    date.getDate() === day
  ) {
    return date.toISOString();
  }
  
  return null;
}

/**
 * Returns the effective date for a transaction
 * Prioritizes date from Lab Number over stored timestamp
 */
export function getEffectiveDate(noLab: string, timestamp: string): Date {
  const labDateStr = extractDateFromLabNo(noLab);
  if (labDateStr) return new Date(labDateStr);
  return new Date(timestamp);
}

/**
 * Formats a transaction date based on Lab Number or Timestamp
 */
export function formatTransactionDate(noLab: string, timestamp: string): string {
  const date = getEffectiveDate(noLab, timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
