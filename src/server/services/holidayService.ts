interface Holiday {
  name: string;
  date: Date;
  observedDate?: Date; // If the holiday is observed on a different date (e.g., if it falls on weekend)
  description?: string;
}

// Cache for holidays to avoid repeated calculations
const holidayCache: { [year: number]: Holiday[] } = {};

/**
 * Get holidays for a specific year
 * This is a basic implementation with common US holidays
 * In production, you might want to:
 * 1. Use a third-party API or library
 * 2. Make this configurable by organization/location
 * 3. Store holidays in the database
 */
export const getHolidaysForYear = (year: number): Holiday[] => {
  // Return from cache if available
  if (holidayCache[year]) {
    return holidayCache[year];
  }

  const holidays: Holiday[] = [];

  // New Year's Day - January 1
  const newYearsDay = new Date(year, 0, 1);
  let observedDate = adjustForWeekend(newYearsDay);

  holidays.push({
    name: "New Year's Day",
    date: newYearsDay,
    observedDate: observedDate.getTime() !== newYearsDay.getTime() ? observedDate : undefined,
  });

  // Martin Luther King, Jr. Day - Third Monday in January
  holidays.push({
    name: "Martin Luther King, Jr. Day",
    date: getNthDayOfMonth(year, 0, 1, 3), // 3rd Monday (1) of January (0)
  });

  // Presidents' Day - Third Monday in February
  holidays.push({
    name: "Presidents' Day",
    date: getNthDayOfMonth(year, 1, 1, 3), // 3rd Monday (1) of February (1)
  });

  // Memorial Day - Last Monday in May
  holidays.push({
    name: "Memorial Day",
    date: getLastDayOfMonth(year, 4, 1), // Last Monday (1) of May (4)
  });

  // Independence Day - July 4
  const independenceDay = new Date(year, 6, 4);
  observedDate = adjustForWeekend(independenceDay);
  
  holidays.push({
    name: "Independence Day",
    date: independenceDay,
    observedDate: observedDate.getTime() !== independenceDay.getTime() ? observedDate : undefined,
  });

  // Labor Day - First Monday in September
  holidays.push({
    name: "Labor Day",
    date: getNthDayOfMonth(year, 8, 1, 1), // 1st Monday (1) of September (8)
  });

  // Columbus Day / Indigenous Peoples' Day - Second Monday in October
  holidays.push({
    name: "Columbus Day",
    date: getNthDayOfMonth(year, 9, 1, 2), // 2nd Monday (1) of October (9)
  });

  // Veterans Day - November 11
  const veteransDay = new Date(year, 10, 11);
  observedDate = adjustForWeekend(veteransDay);
  
  holidays.push({
    name: "Veterans Day",
    date: veteransDay,
    observedDate: observedDate.getTime() !== veteransDay.getTime() ? observedDate : undefined,
  });

  // Thanksgiving Day - Fourth Thursday in November
  holidays.push({
    name: "Thanksgiving Day",
    date: getNthDayOfMonth(year, 10, 4, 4), // 4th Thursday (4) of November (10)
  });

  // Christmas Day - December 25
  const christmasDay = new Date(year, 11, 25);
  observedDate = adjustForWeekend(christmasDay);
  
  holidays.push({
    name: "Christmas Day",
    date: christmasDay,
    observedDate: observedDate.getTime() !== christmasDay.getTime() ? observedDate : undefined,
  });

  // Cache the results
  holidayCache[year] = holidays;

  return holidays;
};

/**
 * Check if a date is a holiday
 */
export const isHoliday = (date: Date): boolean => {
  // Get holidays for the year
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);

  // Strip time component for comparison
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  // Check if the date matches any holiday (either actual date or observed date)
  return holidays.some(holiday => {
    // Check actual holiday date
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);
    
    if (holidayDate.getTime() === compareDate.getTime()) {
      return true;
    }

    // Check observed date if available
    if (holiday.observedDate) {
      const observedDate = new Date(holiday.observedDate);
      observedDate.setHours(0, 0, 0, 0);
      
      if (observedDate.getTime() === compareDate.getTime()) {
        return true;
      }
    }

    return false;
  });
};

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Helper function to get the nth occurrence of a specific day in a month
 * @param year Year
 * @param month Month (0-11)
 * @param dayOfWeek Day of week (0-6, where 0 is Sunday)
 * @param n The occurrence (1 for 1st, 2 for 2nd, etc.)
 */
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  // Start with the first day of the month
  const date = new Date(year, month, 1);
  
  // Find the first occurrence of dayOfWeek
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }
  
  // Add (n-1) weeks to get to the nth occurrence
  date.setDate(date.getDate() + (n - 1) * 7);
  
  return date;
}

/**
 * Helper function to get the last occurrence of a specific day in a month
 */
function getLastDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  // Start with the last day of the month
  const date = new Date(year, month + 1, 0);
  
  // Move backward until we find the specified day of week
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
}

/**
 * Adjust the date if it falls on a weekend
 * For holidays on Saturday, observe on Friday
 * For holidays on Sunday, observe on Monday
 */
function adjustForWeekend(date: Date): Date {
  const day = date.getDay();
  const result = new Date(date);
  
  if (day === 0) { // Sunday
    result.setDate(date.getDate() + 1); // Observe on Monday
  } else if (day === 6) { // Saturday
    result.setDate(date.getDate() - 1); // Observe on Friday
  }
  
  return result;
}

/**
 * Get the next business day after a given date
 * Skips weekends and holidays
 */
export const getNextBusinessDay = (date: Date): Date => {
  const result = new Date(date);
  
  // Move to the next day
  result.setDate(result.getDate() + 1);
  
  // Keep moving forward until we find a business day
  while (isWeekend(result) || isHoliday(result)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
};

export default {
  getHolidaysForYear,
  isHoliday,
  isWeekend,
  getNextBusinessDay
}; 