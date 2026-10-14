import { RunEntry, RunStats } from '../types/run';
import { formatPaceFromSeconds } from './pace';

const STORAGE_KEY = 'daily_running_tracker_entries_v1';

const INITIAL_STARTER_RUNS: RunEntry[] = [
  {
    id: 'run-1',
    dayNumber: 1,
    date: '2026-10-10',
    distanceKm: 3.2,
    timeStr: '19:12',
    durationSeconds: 1152,
    paceStr: '6:00 /km',
    paceSeconds: 360,
    speedKmh: 10.0,
    notes: 'First day kick-off! Felt good, steady rhythm.',
    createdAt: new Date('2026-10-10T08:00:00Z').toISOString(),
  },
  {
    id: 'run-2',
    dayNumber: 2,
    date: '2026-10-11',
    distanceKm: 4.0,
    timeStr: '23:20',
    durationSeconds: 1400,
    paceStr: '5:50 /km',
    paceSeconds: 350,
    speedKmh: 10.29,
    notes: 'Morning park route. Legs feeling looser.',
    createdAt: new Date('2026-10-11T08:15:00Z').toISOString(),
  },
  {
    id: 'run-3',
    dayNumber: 3,
    date: '2026-10-12',
    distanceKm: 5.0,
    timeStr: '28:30',
    durationSeconds: 1710,
    paceStr: '5:42 /km',
    paceSeconds: 342,
    speedKmh: 10.53,
    notes: '5K milestone unlocked! Strong final kilometer.',
    createdAt: new Date('2026-10-12T07:45:00Z').toISOString(),
  },
  {
    id: 'run-4',
    dayNumber: 4,
    date: '2026-10-13',
    distanceKm: 3.5,
    timeStr: '19:40',
    durationSeconds: 1180,
    paceStr: '5:37 /km',
    paceSeconds: 337,
    speedKmh: 10.68,
    notes: 'Tempo recovery run. Excellent breathing.',
    createdAt: new Date('2026-10-13T08:00:00Z').toISOString(),
  },
];

export function getStoredRuns(): RunEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First visit: store starter runs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STARTER_RUNS));
      return INITIAL_STARTER_RUNS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_STARTER_RUNS;
  } catch (err) {
    console.error('Failed to load runs from localStorage', err);
    return INITIAL_STARTER_RUNS;
  }
}

export function saveStoredRuns(runs: RunEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch (err) {
    console.error('Failed to save runs to localStorage', err);
  }
}

export function resetToStarterRuns(): RunEntry[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STARTER_RUNS));
  return INITIAL_STARTER_RUNS;
}

export function clearAllRuns(): RunEntry[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

export function calculateStats(runs: RunEntry[]): RunStats {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalDistanceKm: 0,
      totalDurationSeconds: 0,
      averagePaceSeconds: 0,
      averagePaceStr: '--:--',
      longestRunKm: 0,
      currentStreakDays: 0,
    };
  }

  const totalRuns = runs.length;
  const totalDistanceKm = parseFloat(
    runs.reduce((sum, r) => sum + (r.distanceKm || 0), 0).toFixed(2)
  );
  const totalDurationSeconds = runs.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);

  const avgPaceSeconds =
    totalDistanceKm > 0 ? Math.round(totalDurationSeconds / totalDistanceKm) : 0;
  const averagePaceStr = formatPaceFromSeconds(avgPaceSeconds);

  const longestRunKm = runs.reduce(
    (max, r) => Math.max(max, r.distanceKm || 0),
    0
  );

  // Calculate streak based on sorted unique dates
  const sortedRuns = [...runs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const uniqueDates = Array.from(new Set(sortedRuns.map((r) => r.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let streak = 0;
  if (uniqueDates.length > 0) {
    // Check consecutive days
    streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return {
    totalRuns,
    totalDistanceKm,
    totalDurationSeconds,
    averagePaceSeconds: avgPaceSeconds,
    averagePaceStr,
    longestRunKm,
    currentStreakDays: streak,
  };
}

export function exportRunsToCSV(runs: RunEntry[]): void {
  const headers = ['Day', 'Date', 'Distance (km)', 'Time', 'Duration (seconds)', 'Pace (/km)', 'Speed (km/h)', 'Notes'];
  const rows = runs.map((r) => [
    `Day ${r.dayNumber}`,
    r.date,
    r.distanceKm,
    `"${r.timeStr}"`,
    r.durationSeconds,
    `"${r.paceStr}"`,
    r.speedKmh,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `running_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
