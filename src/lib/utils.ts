import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  // Use Indian locale for INR, US locale for others
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatOdds(odds: number, format: 'decimal' | 'fractional' | 'american' = 'decimal'): string {
  // Check if odds is a valid number
  if (typeof odds !== 'number' || isNaN(odds) || odds === undefined || odds === null) {
    return 'N/A';
  }

  switch (format) {
    case 'decimal':
      return odds.toFixed(2);
    case 'fractional':
      const numerator = Math.round((odds - 1) * 100);
      return `${numerator}/100`;
    case 'american':
      return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
    default:
      return odds.toFixed(2);
  }
}

export function formatDate(date: Date): string {
  // Convert to Date object if it's a string or invalid
  let validDate: Date;
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    validDate = date;
  } else if (typeof date === 'string') {
    validDate = new Date(date);
    if (isNaN(validDate.getTime())) {
      return 'Invalid Date';
    }
  } else {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(validDate);
}