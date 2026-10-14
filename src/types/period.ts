export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'spotting';

export interface PeriodEntry {
  date: string; // YYYY-MM-DD
  flow?: FlowIntensity;
  symptoms?: string[]; // e.g. ['cramps', 'fatigue', 'high_energy', 'bloating']
  notes?: string;
  isPeriodStart?: boolean;
}

export interface CycleSettings {
  averageCycleLength: number; // default 28
  averagePeriodLength: number; // default 5
  lastPeriodStartDate?: string;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';
