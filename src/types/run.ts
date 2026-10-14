export interface RunEntry {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  timeStr: string; // MM:SS or HH:MM:SS
  durationSeconds: number;
  paceStr: string; // e.g. "5:30 min/km"
  paceSeconds: number; // seconds per km
  speedKmh: number;
  notes?: string;
  createdAt: string;
}

export interface RunStats {
  totalRuns: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  averagePaceSeconds: number;
  averagePaceStr: string;
  longestRunKm: number;
  currentStreakDays: number;
}
