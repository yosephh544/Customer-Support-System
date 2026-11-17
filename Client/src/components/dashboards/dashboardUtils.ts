import type { WeeklySchedule } from '../../types';
import { isActiveSchedule } from '../../types';

export type PillTone = 'good' | 'warn' | 'bad' | 'muted' | 'accent';

// Picks the cycle that best represents current operations: Active first, then
// published schedules with items, then the most recent year/week.
export const pickFocusSchedule = (schedules: WeeklySchedule[]): WeeklySchedule | null => {
  if (!schedules || schedules.length === 0) return null;
  const rank = (schedule: WeeklySchedule): number => {
    if (isActiveSchedule(schedule.status)) return 4;
    if (schedule.isPublished) return 2;
    return 0;
  };
  return [...schedules].sort((a, b) => {
    const rankDiff = rank(b) - rank(a);
    if (rankDiff !== 0) return rankDiff;
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    const weekDiff = (b.weekNumber || 0) - (a.weekNumber || 0);
    if (weekDiff !== 0) return weekDiff;
    return new Date(b.weekStartDate || 0).getTime() - new Date(a.weekStartDate || 0).getTime();
  })[0];
};

export const rateTone = (rate: number): PillTone => {
  if (rate >= 90) return 'good';
  if (rate >= 70) return 'warn';
  return 'bad';
};

export const rateColor = (rate: number): string => {
  if (rate >= 90) return '#10B981';
  if (rate >= 70) return '#F59E0B';
  return '#EF4444';
};
