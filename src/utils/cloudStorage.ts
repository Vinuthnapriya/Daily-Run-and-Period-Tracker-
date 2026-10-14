import type { User } from '@supabase/supabase-js';
import type { PeriodEntry, CycleSettings } from '../types/period';
import type { RunEntry } from '../types/run';
import { supabase } from '../lib/supabase';

export interface TrackerData {
  runs: RunEntry[];
  periodEntries: Record<string, PeriodEntry>;
  cycleSettings: CycleSettings;
}

const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
};

const RUNS_KEY = 'daily_running_tracker_entries_v1';
const PERIOD_ENTRIES_KEY = 'daily_period_tracker_entries_v1';
const CYCLE_SETTINGS_KEY = 'daily_period_cycle_settings_v1';
const LEGACY_MIGRATION_KEY = 'daily_tracker_cloud_migration_complete_v1';

function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and anon key to your environment.');
  }
  return supabase;
}

function readLegacyValue<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : JSON.parse(raw) as T;
}

export function getLegacyTrackerData(): TrackerData {
  if (localStorage.getItem(LEGACY_MIGRATION_KEY) === 'true') {
    return {
      runs: [],
      periodEntries: {},
      cycleSettings: DEFAULT_CYCLE_SETTINGS,
    };
  }

  const runs = readLegacyValue<RunEntry[]>(RUNS_KEY, []);
  const periodEntries = readLegacyValue<Record<string, PeriodEntry>>(PERIOD_ENTRIES_KEY, {});
  const cycleSettings = {
    ...DEFAULT_CYCLE_SETTINGS,
    ...readLegacyValue<Partial<CycleSettings>>(CYCLE_SETTINGS_KEY, {}),
  };

  if (!Array.isArray(runs) || !periodEntries || typeof periodEntries !== 'object') {
    throw new Error('Existing browser data has an unexpected format and could not be migrated.');
  }

  return { runs, periodEntries, cycleSettings };
}

export function markLegacyTrackerDataMigrated(): void {
  localStorage.setItem(LEGACY_MIGRATION_KEY, 'true');
}

export async function loadTrackerData(user: User): Promise<TrackerData | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('user_tracker_data')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const trackerData = data.data as Partial<TrackerData> | null;
  if (
    !trackerData ||
    !Array.isArray(trackerData.runs) ||
    !trackerData.periodEntries ||
    typeof trackerData.periodEntries !== 'object' ||
    !trackerData.cycleSettings ||
    typeof trackerData.cycleSettings !== 'object'
  ) {
    throw new Error('Saved cloud data has an unexpected format. It was not overwritten.');
  }

  return {
    runs: trackerData.runs,
    periodEntries: trackerData.periodEntries,
    cycleSettings: { ...DEFAULT_CYCLE_SETTINGS, ...trackerData.cycleSettings },
  };
}

export async function saveTrackerData(user: User, trackerData: TrackerData): Promise<void> {
  const client = getSupabase();
  const { error } = await client.from('user_tracker_data').upsert(
    {
      user_id: user.id,
      data: trackerData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}
