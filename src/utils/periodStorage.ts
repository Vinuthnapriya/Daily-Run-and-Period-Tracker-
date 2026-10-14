import { PeriodEntry, CycleSettings, CyclePhase } from '../types/period';

const PERIOD_STORAGE_KEY = 'daily_period_tracker_entries_v1';
const CYCLE_SETTINGS_KEY = 'daily_period_cycle_settings_v1';

// Initial realistic starter period logs around early this month
const INITIAL_STARTER_PERIODS: Record<string, PeriodEntry> = {
  '2026-10-01': {
    date: '2026-10-01',
    flow: 'medium',
    isPeriodStart: true,
    symptoms: ['cramps', 'fatigue'],
    notes: 'Period started, took easy run',
  },
  '2026-10-02': {
    date: '2026-10-02',
    flow: 'heavy',
    symptoms: ['cramps'],
    notes: 'Rest day',
  },
  '2026-10-03': {
    date: '2026-10-03',
    flow: 'medium',
    symptoms: ['bloating'],
  },
  '2026-10-04': {
    date: '2026-10-04',
    flow: 'light',
  },
  '2026-10-05': {
    date: '2026-10-05',
    flow: 'spotting',
    symptoms: ['high_energy'],
    notes: 'Energy back up!',
  },
};

const DEFAULT_SETTINGS: CycleSettings = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  lastPeriodStartDate: '2026-10-01',
};

export function getStoredPeriodEntries(): Record<string, PeriodEntry> {
  try {
    const raw = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(INITIAL_STARTER_PERIODS));
      return INITIAL_STARTER_PERIODS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read period entries from storage', err);
    return INITIAL_STARTER_PERIODS;
  }
}

export function saveStoredPeriodEntries(entries: Record<string, PeriodEntry>): void {
  try {
    localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save period entries to storage', err);
  }
}

export function getStoredCycleSettings(): CycleSettings {
  try {
    const raw = localStorage.getItem(CYCLE_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(CYCLE_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to read cycle settings from storage', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredCycleSettings(settings: CycleSettings): void {
  try {
    localStorage.setItem(CYCLE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save cycle settings to storage', err);
  }
}

/**
 * Finds the latest marked period start date
 */
export function getLatestPeriodStartDate(entries: Record<string, PeriodEntry>): string | null {
  const dates = Object.keys(entries)
    .filter((d) => entries[d].isPeriodStart || entries[d].flow)
    .sort();

  if (dates.length === 0) return null;

  // Group into streaks: first day of a streak is a period start
  const periodStarts: string[] = [];
  for (let i = 0; i < dates.length; i++) {
    const curr = new Date(dates[i]);
    const prev = i > 0 ? new Date(dates[i - 1]) : null;

    if (!prev) {
      periodStarts.push(dates[i]);
    } else {
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      // If more than 2 days gap, this is a new cycle period start
      if (diffDays > 2) {
        periodStarts.push(dates[i]);
      }
    }
  }

  return periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : dates[dates.length - 1];
}

/**
 * Predicts next period start and fertile window
 */
export function calculateCyclePredictions(
  entries: Record<string, PeriodEntry>,
  settings: CycleSettings
): {
  lastStartDate: string | null;
  predictedNextStartDate: string | null;
  daysUntilNextPeriod: number | null;
  predictedPeriodDates: string[];
  predictedFertileDates: string[];
  currentCycleDay: number | null;
  currentPhase: CyclePhase;
} {
  const lastStartDate = getLatestPeriodStartDate(entries) || settings.lastPeriodStartDate || null;

  if (!lastStartDate) {
    return {
      lastStartDate: null,
      predictedNextStartDate: null,
      daysUntilNextPeriod: null,
      predictedPeriodDates: [],
      predictedFertileDates: [],
      currentCycleDay: null,
      currentPhase: 'unknown',
    };
  }

  const lastStart = new Date(lastStartDate);
  const nextStart = new Date(lastStart);
  nextStart.setDate(nextStart.getDate() + settings.averageCycleLength);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = nextStart.getTime() - today.getTime();
  const daysUntilNextPeriod = Math.round(diffTime / (1000 * 3600 * 24));

  // Current cycle day
  const sinceLastStartTime = today.getTime() - lastStart.getTime();
  const rawCycleDay = Math.floor(sinceLastStartTime / (1000 * 3600 * 24)) + 1;
  const currentCycleDay = rawCycleDay > 0 ? ((rawCycleDay - 1) % settings.averageCycleLength) + 1 : 1;

  // Determine current phase
  let currentPhase: CyclePhase = 'unknown';
  if (currentCycleDay <= settings.averagePeriodLength) {
    currentPhase = 'menstrual';
  } else if (currentCycleDay <= 12) {
    currentPhase = 'follicular';
  } else if (currentCycleDay <= 16) {
    currentPhase = 'ovulation';
  } else {
    currentPhase = 'luteal';
  }

  // Generate predicted period dates (next cycle)
  const predictedPeriodDates: string[] = [];
  for (let i = 0; i < settings.averagePeriodLength; i++) {
    const d = new Date(nextStart);
    d.setDate(d.getDate() + i);
    predictedPeriodDates.push(d.toISOString().slice(0, 10));
  }

  // Predicted ovulation ~14 days before next period start, window is ~5 days
  const ovulationDay = new Date(nextStart);
  ovulationDay.setDate(ovulationDay.getDate() - 14);

  const predictedFertileDates: string[] = [];
  for (let i = -3; i <= 1; i++) {
    const d = new Date(ovulationDay);
    d.setDate(d.getDate() + i);
    predictedFertileDates.push(d.toISOString().slice(0, 10));
  }

  return {
    lastStartDate,
    predictedNextStartDate: nextStart.toISOString().slice(0, 10),
    daysUntilNextPeriod,
    predictedPeriodDates,
    predictedFertileDates,
    currentCycleDay,
    currentPhase,
  };
}
