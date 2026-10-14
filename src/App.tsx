import React, { useState, useEffect, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { RunEntry, RunStats } from './types/run';
import { PeriodEntry, CycleSettings } from './types/period';
import { calculateStats } from './utils/storage';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { RunForm } from './components/RunForm';
import { RunsTable } from './components/RunsTable';
import { ProgressCharts } from './components/ProgressCharts';
import { PaceCalculatorModal } from './components/PaceCalculatorModal';
import { PeriodTrackerModal } from './components/PeriodTrackerModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AuthScreen } from './components/AuthScreen';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  getLegacyTrackerData,
  loadTrackerData,
  markLegacyTrackerDataMigrated,
  saveTrackerData,
} from './utils/cloudStorage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setAuthError(null);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
      }
      setIsCheckingSession(false);
    }).catch((error: unknown) => {
      if (!isMounted) return;
      setAuthError(error instanceof Error ? error.message : 'Could not check your sign-in session.');
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isCheckingSession) {
    return <CenteredMessage message="Checking your sign-in…" />;
  }

  if (!supabase) {
    return <AuthScreen />;
  }

  if (authError) {
    return <CenteredMessage message={`Sign-in check failed: ${authError}`} />;
  }

  if (!session?.user) {
    return <AuthScreen />;
  }

  return <TrackerApp key={session.user.id} user={session.user} />;
}

function TrackerApp({ user }: { user: User }) {
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [editingRun, setEditingRun] = useState<RunEntry | null>(null);
  const [runToDelete, setRunToDelete] = useState<RunEntry | null>(null);
  const [isPaceCalculatorOpen, setIsPaceCalculatorOpen] = useState(false);
  const [isPeriodTrackerOpen, setIsPeriodTrackerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [periodEntries, setPeriodEntries] = useState<Record<string, PeriodEntry>>({});
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>({
    averageCycleLength: 28,
    averagePeriodLength: 5,
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);

  useEffect(() => {
    let isCurrent = true;
    setIsDataLoaded(false);
    setDataError(null);

    const load = async () => {
      try {
        const cloudData = await loadTrackerData(user);
        const trackerData = cloudData ?? getLegacyTrackerData();
        if (!cloudData) {
          await saveTrackerData(user, trackerData);
          markLegacyTrackerDataMigrated();
        }
        if (!isCurrent) return;
        setRuns(trackerData.runs);
        setPeriodEntries(trackerData.periodEntries);
        setCycleSettings(trackerData.cycleSettings);
        setIsDataLoaded(true);
      } catch (error) {
        if (!isCurrent) return;
        console.error('Failed to load tracker data from Supabase', error);
        setDataError(error instanceof Error ? error.message : 'Could not load your tracker data.');
      }
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [user, loadAttempt]);

  useEffect(() => {
    if (!isDataLoaded) return;

    const version = ++saveVersion.current;
    const snapshot = { runs, periodEntries, cycleSettings };
    setSaveState('saving');
    saveQueue.current = saveQueue.current
      .then(() => saveTrackerData(user, snapshot))
      .then(() => {
        if (version === saveVersion.current) {
          setSaveState('saved');
          setDataError(null);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to save tracker data to Supabase', error);
        if (version === saveVersion.current) {
          setSaveState('error');
          setDataError(error instanceof Error ? error.message : 'Could not save your tracker data.');
        }
      });
  }, [runs, periodEntries, cycleSettings, isDataLoaded, user]);

  const stats: RunStats = calculateStats(runs);

  // Calculate next suggested day number
  const nextDayNumber =
    runs.length > 0 ? Math.max(...runs.map((r) => r.dayNumber)) + 1 : 1;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleAddRun = (newRunData: Omit<RunEntry, 'id' | 'createdAt'>) => {
    const newEntry: RunEntry = {
      ...newRunData,
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setRuns((prev) => [newEntry, ...prev]);
    showToast(`Logged Day ${newEntry.dayNumber} successfully!`);
  };

  const handleUpdateRun = (id: string, updatedData: Omit<RunEntry, 'id' | 'createdAt'>) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...updatedData,
            }
          : r
      )
    );
    setEditingRun(null);
    showToast(`Updated Day ${updatedData.dayNumber} entry!`);
  };

  const handleEditClick = (run: RunEntry) => {
    setEditingRun(run);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = () => {
    if (!runToDelete) return;
    const deletedDay = runToDelete.dayNumber;
    setRuns((prev) => prev.filter((r) => r.id !== runToDelete.id));
    if (editingRun?.id === runToDelete.id) {
      setEditingRun(null);
    }
    setRunToDelete(null);
    showToast(`Deleted Day ${deletedDay} entry.`);
  };

  // Period tracker actions
  const handleSavePeriodEntry = (entry: PeriodEntry) => {
    setPeriodEntries((prev) => ({
      ...prev,
      [entry.date]: entry,
    }));
    showToast(`Period details saved for ${entry.date}`);
  };

  const handleDeletePeriodEntry = (dateStr: string) => {
    setPeriodEntries((prev) => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
    showToast(`Cleared period details for ${dateStr}`);
  };

  const handleUpdateCycleSettings = (newSettings: CycleSettings) => {
    setCycleSettings(newSettings);
    showToast('Cycle settings updated!');
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setDataError(`Could not sign out: ${error.message}`);
    }
  };

  if (dataError && !isDataLoaded) {
    return (
      <CenteredMessage
        message={`Could not load your saved data: ${dataError}`}
        action={
          <button
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Try again
          </button>
        }
      />
    );
  }

  if (!isDataLoaded) {
    return <CenteredMessage message="Loading your saved tracker data…" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Header with Streak, Pace Calculator & Period Tracker Tabs */}
      <Header
        streakDays={stats.currentStreakDays}
        onOpenPaceCalculator={() => setIsPaceCalculatorOpen(true)}
        onOpenPeriodTracker={() => setIsPeriodTrackerOpen(true)}
        userEmail={user.email ?? ''}
        onSignOut={() => void handleSignOut()}
      />

      {dataError && (
        <div role="alert" className="bg-rose-950 px-4 py-2 text-center text-sm text-rose-200">
          Cloud save failed: {dataError}. Keep this page open and check your connection; changes
          may not be saved yet.
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-800 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* Summary Stats Cards: Total KMs, Days Logged, Streaks, Average Pace, Total Time */}
        <StatsCards stats={stats} />

        {/* Progress Trend Graph */}
        <ProgressCharts runs={runs} />

        {/* Main 2-Column Section: Form & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Log / Edit Daily Run Form */}
          <div className="lg:col-span-5">
            <RunForm
              onAddRun={handleAddRun}
              onUpdateRun={handleUpdateRun}
              editingRun={editingRun}
              onCancelEdit={() => setEditingRun(null)}
              nextDayNumber={nextDayNumber}
            />
          </div>

          {/* Right Column: History Table with Working Edit & In-App Delete */}
          <div className="lg:col-span-7">
            <RunsTable
              runs={runs}
              editingRunId={editingRun?.id || null}
              onEditRun={handleEditClick}
              onRequestDelete={(run) => setRunToDelete(run)}
            />
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Daily Running Tracker &middot;{' '}
        {saveState === 'saving'
          ? 'Syncing to your private cloud account…'
          : saveState === 'error'
            ? 'Cloud sync needs attention'
            : 'Saved to your cloud account'}
      </footer>

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmationModal
        run={runToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRunToDelete(null)}
      />

      {/* Target Pace Calculator Modal */}
      <PaceCalculatorModal
        isOpen={isPaceCalculatorOpen}
        onClose={() => setIsPaceCalculatorOpen(false)}
      />

      {/* Period Tracker Calendar Modal */}
      <PeriodTrackerModal
        isOpen={isPeriodTrackerOpen}
        onClose={() => setIsPeriodTrackerOpen(false)}
        entries={periodEntries}
        onSaveEntry={handleSavePeriodEntry}
        onDeleteEntry={handleDeletePeriodEntry}
        cycleSettings={cycleSettings}
        onUpdateSettings={handleUpdateCycleSettings}
        runs={runs}
      />
    </div>
  );
}

function CenteredMessage({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-200">
      <p>{message}</p>
      {action}
    </main>
  );
}
