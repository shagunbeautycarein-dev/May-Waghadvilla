/**
 * Calculate running rent difference using ACTUAL calendar days
 * Formula: Per Day Rent = Monthly Rent / Days in Joining Month
 * Difference Days = Days from Joining Date (inclusive) to Rent Cycle Date (exclusive)
 */
export function calculateRentDifference(
  monthlyRent: number,
  joiningDate: Date,
  rentCycleDate: number // e.g., 5
): { perDayRent: number; differenceDays: number; differenceAmount: number } {
  const rent = Number(monthlyRent);
  const joinDate = new Date(joiningDate);
  joinDate.setHours(0, 0, 0, 0);

  const year = joinDate.getFullYear();
  const month = joinDate.getMonth(); // 0-indexed

  // Get actual days in joining month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Per day rent
  const perDayRent = rent / daysInMonth;

  // If joining date is on or after rent cycle date, no partial rent difference
  // The guest's rent cycle starts from the next full cycle
  if (joinDate.getDate() >= rentCycleDate) {
    return {
      perDayRent: Math.round(perDayRent),
      differenceDays: 0,
      differenceAmount: 0,
    };
  }

  // Calculate difference days
  let differenceDays = 0;
  let currentDate = new Date(joinDate);

  // Count days from joining date (inclusive) until we hit the cycle date
  while (true) {
    differenceDays++;
    currentDate.setDate(currentDate.getDate() + 1);

    // Stop when we reach the cycle date
    if (currentDate.getDate() === rentCycleDate) {
      break;
    }

    // Safety: stop after 60 days to prevent infinite loops
    if (differenceDays > 60) {
      break;
    }
  }

  const differenceAmount = perDayRent * differenceDays;

  return {
    perDayRent: Math.round(perDayRent),
    differenceDays,
    differenceAmount: Math.round(differenceAmount),
  };
}

export function calculateTotalPayable(
  monthlyRent: number,
  deposit: number,
  differenceAmount: number
): number {
  return Number(monthlyRent) + Number(deposit) + Number(differenceAmount);
}
