import React, { useState, useEffect } from 'react';
import { PeriodEntry, CycleSettings, FlowIntensity } from '../types/period';
import { calculateCyclePredictions } from '../utils/periodStorage';
import { RunEntry } from '../types/run';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Edit2,
  List,
  Plus,
  Settings,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface PeriodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Record<string, PeriodEntry>;
  onSaveEntry: (entry: PeriodEntry) => void;
  onDeleteEntry: (dateStr: string) => void;
  cycleSettings: CycleSettings;
  onUpdateSettings: (settings: CycleSettings) => void;
  runs: RunEntry[];
}

const SYMPTOMS_LIST = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'high_energy', label: 'High Energy' },
  { id: 'headache', label: 'Headache' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'soreness', label: 'Muscle Soreness' },
];

export const PeriodTrackerModal: React.FC<PeriodTrackerModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
  onDeleteEntry,
  cycleSettings,
  onUpdateSettings,
  runs,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'entries'>('calendar');
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [showSettings, setShowSettings] = useState(false);

  // Form states
  const [formDate, setFormDate] = useState<string>(selectedDateStr);
  const [formFlow, setFormFlow] = useState<FlowIntensity>('medium');
  const [formSymptoms, setFormSymptoms] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Cycle settings state
  const [cycleLen, setCycleLen] = useState(cycleSettings.averageCycleLength);
  const [periodLen, setPeriodLen] = useState(cycleSettings.averagePeriodLength);

  // Synchronize form when selectedDateStr or entries change
  useEffect(() => {
    setFormDate(selectedDateStr);
    const existing = entries[selectedDateStr];
    if (existing) {
      setFormFlow(existing.flow || 'medium');
      setFormSymptoms(existing.symptoms || []);
      setFormNotes(existing.notes || '');
    } else {
      setFormFlow('medium');
      setFormSymptoms([]);
      setFormNotes('');
    }
  }, [selectedDateStr, entries]);

  if (!isOpen) return null;

  const predictions = calculateCyclePredictions(entries, cycleSettings);

  // Map runs by date (YYYY-MM-DD) for running correlation
  const runsByDate: Record<string, RunEntry> = {};
  runs.forEach((r) => {
    runsByDate[r.date] = r;
  });

  // Sorted list of all entries for the "Entries" table
  const allEntriesList = Object.values(entries).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const existingEntryForSelectedDate = entries[selectedDateStr];

  // Month navigation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentMonthDate(now);
    setSelectedDateStr(now.toISOString().slice(0, 10));
  };

  // Calendar days generation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, day);
    const dateStr = dateObj.toISOString().slice(0, 10);
    calendarDays.push({
      day,
      dateStr,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = dateObj.toISOString().slice(0, 10);
    calendarDays.push({
      day,
      dateStr,
      isCurrentMonth: true,
    });
  }

  // Next month leading days
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= (remainingCells >= 7 ? remainingCells - 7 : remainingCells); day++) {
    const dateObj = new Date(year, month + 1, day);
    const dateStr = dateObj.toISOString().slice(0, 10);
    calendarDays.push({
      day,
      dateStr,
      isCurrentMonth: false,
    });
  }

  const handleToggleSymptom = (symptomId: string) => {
    setFormSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((s) => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSaveOrUpdateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;

    const isUpdate = Boolean(entries[formDate]);

    onSaveEntry({
      date: formDate,
      flow: formFlow,
      symptoms: formSymptoms,
      notes: formNotes.trim() || undefined,
    });

    setSelectedDateStr(formDate);

    // Keep currentMonthDate aligned with saved date
    const parsedDate = new Date(formDate);
    if (!isNaN(parsedDate.getTime())) {
      setCurrentMonthDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }

    setFeedbackNotice(isUpdate ? `Updated entry for ${formDate}!` : `Saved entry for ${formDate}!`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleDeleteCurrentEntry = (dateStr: string) => {
    onDeleteEntry(dateStr);
    setFeedbackNotice(`Deleted entry for ${dateStr}.`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleSelectEntryForEdit = (entry: PeriodEntry) => {
    setSelectedDateStr(entry.date);
    setFormDate(entry.date);
    setFormFlow(entry.flow || 'medium');
    setFormSymptoms(entry.symptoms || []);
    setFormNotes(entry.notes || '');

    const parsedDate = new Date(entry.date);
    if (!isNaN(parsedDate.getTime())) {
      setCurrentMonthDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }

    setActiveTab('calendar');
    setFeedbackNotice(`Editing entry for ${entry.date}`);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      averageCycleLength: Number(cycleLen) || 28,
      averagePeriodLength: Number(periodLen) || 5,
    });
    setShowSettings(false);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const getPhaseAdvice = (phase: string) => {
    switch (phase) {
      case 'menstrual':
        return 'Menstrual Phase: Hydrate well, prioritize steady or easy recovery runs, listen to fatigue.';
      case 'follicular':
        return 'Follicular Phase: Estrogen rising, energy peaking! Great time for speed intervals and 5k/10k tempo runs.';
      case 'ovulation':
        return 'Ovulation Phase: Peak stamina. Maintain steady pacing and warm up thoroughly.';
      case 'luteal':
        return 'Luteal Phase: Higher body temperature. Focus on steady endurance runs with good cool-downs.';
      default:
        return 'Log period days to calculate cycle phase predictions & running advice.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Period Tracker</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                  {allEntriesList.length} Entries Logged
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log flow, symptoms, update or delete entries anytime
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher: Calendar vs All Entries */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('entries')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'entries'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>All Entries ({allEntriesList.length})</span>
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Cycle Settings"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback notice toast */}
        {feedbackNotice && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Collapsible Settings */}
        {showSettings && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl my-2 text-xs space-y-3 shrink-0">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Cycle Settings</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Average Cycle Length (Days)</label>
                <input
                  type="number"
                  min="20"
                  max="45"
                  value={cycleLen}
                  onChange={(e) => setCycleLen(parseInt(e.target.value, 10) || 28)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Average Period Duration (Days)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={periodLen}
                  onChange={(e) => setPeriodLen(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Cycle Prediction Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2.5 shrink-0">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Cycle Status</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-white font-mono">
                {predictions.currentCycleDay ? `Day ${predictions.currentCycleDay}` : 'Not set'}
              </span>
              <span className="text-xs text-rose-400 capitalize">
                ({predictions.currentPhase} phase)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Next Period</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-rose-400 font-mono">
                {predictions.daysUntilNextPeriod !== null
                  ? predictions.daysUntilNextPeriod > 0
                    ? `in ~${predictions.daysUntilNextPeriod} days`
                    : 'Expected today'
                  : 'Log period to predict'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mb-0.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Runner Advice</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">
              {getPhaseAdvice(predictions.currentPhase)}
            </p>
          </div>
        </div>

        {/* TAB 1: CALENDAR VIEW */}
        {activeTab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
            {/* Calendar Section (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              {/* Month Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {monthNames[month]} {year}
                  </span>
                  <button
                    onClick={jumpToToday}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Today
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-semibold text-slate-500 uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 flex-1">
                {calendarDays.map((cell) => {
                  const entry = entries[cell.dateStr];
                  const isSelected = selectedDateStr === cell.dateStr;
                  const isToday = cell.dateStr === todayStr;
                  const isPeriod = Boolean(entry?.flow);
                  const isPredictedPeriod =
                    !isPeriod && predictions.predictedPeriodDates.includes(cell.dateStr);
                  const isFertile = predictions.predictedFertileDates.includes(cell.dateStr);
                  const run = runsByDate[cell.dateStr];

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`min-h-[56px] p-1 rounded-xl text-left flex flex-col justify-between transition border relative ${
                        isSelected
                          ? 'ring-2 ring-rose-400 border-rose-400 bg-rose-950/40'
                          : isPeriod
                          ? 'bg-rose-950/50 border-rose-800/80 hover:border-rose-600'
                          : isPredictedPeriod
                          ? 'bg-rose-950/20 border-dashed border-rose-800/50 hover:border-rose-700'
                          : isFertile
                          ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-600'
                          : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                      } ${!cell.isCurrentMonth ? 'opacity-35' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center'
                              : isPeriod
                              ? 'text-rose-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {isPeriod && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              entry?.flow === 'heavy'
                                ? 'bg-rose-400'
                                : entry?.flow === 'medium'
                                ? 'bg-rose-500'
                                : entry?.flow === 'light'
                                ? 'bg-rose-400/70'
                                : 'bg-rose-300/50'
                            }`}
                            title={`Flow: ${entry?.flow}`}
                          />
                        )}
                      </div>

                      {run && (
                        <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 rounded truncate leading-tight mt-0.5">
                          🏃 {run.distanceKm}k
                        </div>
                      )}

                      {isPeriod && !run && (
                        <span className="text-[9px] text-rose-300/80 font-mono capitalize truncate">
                          {entry?.flow}
                        </span>
                      )}

                      {isPredictedPeriod && !isPeriod && !run && (
                        <span className="text-[8px] text-rose-400/60 font-mono">
                          predicted
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-3 mt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Marked Period</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-dashed border-rose-500 bg-rose-950/40" />
                  <span>Predicted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-950/60 border border-purple-800" />
                  <span>Fertile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🏃</span>
                  <span className="text-emerald-400">Run Logged</span>
                </div>
              </div>
            </div>

            {/* Day Entry Form (5 Cols) */}
            <form onSubmit={handleSaveOrUpdateForm} className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {existingEntryForSelectedDate ? (
                      <>
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Update Period Entry</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-rose-400" />
                        <span>Add Period Entry</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {existingEntryForSelectedDate ? 'Modify or delete this entry' : 'Create entry for selected date'}
                  </p>
                </div>

                {existingEntryForSelectedDate && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    Logged
                  </span>
                )}
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    setSelectedDateStr(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Correlated Run Notice */}
              {runsByDate[formDate] && (
                <div className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                  <span>🏃 Run: Day {runsByDate[formDate].dayNumber} · {runsByDate[formDate].distanceKm} km ({runsByDate[formDate].paceStr})</span>
                </div>
              )}

              {/* Flow Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Period Flow Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['light', 'medium', 'heavy', 'spotting'] as FlowIntensity[]).map((flow) => {
                    const isActive = formFlow === flow;
                    return (
                      <button
                        key={flow}
                        type="button"
                        onClick={() => setFormFlow(flow)}
                        className={`py-2 px-1 text-xs rounded-xl font-medium transition capitalize ${
                          isActive
                            ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20 ring-1 ring-rose-400'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {flow}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Symptoms &amp; Energy
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOMS_LIST.map((sym) => {
                    const isChecked = formSymptoms.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => handleToggleSymptom(sym.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isChecked
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Runner Feelings
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Easy run today, cramps mild..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Submit / Update & Delete Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 ${
                    existingEntryForSelectedDate
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  }`}
                >
                  {existingEntryForSelectedDate ? (
                    <>
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Update Entry for {formDate}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save Entry for {formDate}</span>
                    </>
                  )}
                </button>

                {existingEntryForSelectedDate && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCurrentEntry(formDate)}
                    title={`Delete entry for ${formDate}`}
                    className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* TAB 2: ALL ENTRIES TABLE (View, Edit & Delete) */
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <List className="w-4 h-4 text-rose-400" />
                  <span>Logged Period Entries</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage, edit, or delete any recorded period day
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDateStr(todayStr);
                  setActiveTab('calendar');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Today</span>
              </button>
            </div>

            {allEntriesList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold font-sans">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Flow</th>
                      <th className="py-2.5 px-3">Symptoms</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3">Correlated Run</th>
                      <th className="py-2.5 px-2 text-right font-sans">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allEntriesList.map((entry) => {
                      const run = runsByDate[entry.date];
                      return (
                        <tr key={entry.date} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="capitalize font-semibold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                              {entry.flow || 'medium'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            {entry.symptoms && entry.symptoms.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {entry.symptoms.map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                                  >
                                    {SYMPTOMS_LIST.find((item) => item.id === s)?.label || s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td
                            className="py-3 px-3 text-slate-400 font-sans max-w-[150px] truncate"
                            title={entry.notes || ''}
                          >
                            {entry.notes || '—'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {run ? (
                              <span className="text-emerald-400 font-mono text-xs">
                                🏃 Day {run.dayNumber} ({run.distanceKm}k)
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-sans whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectEntryForEdit(entry)}
                                title={`Edit entry for ${entry.date}`}
                                className="px-2.5 py-1 text-xs rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition flex items-center gap-1 border border-transparent hover:border-amber-400/30"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCurrentEntry(entry.date)}
                                title={`Delete entry for ${entry.date}`}
                                className="px-2.5 py-1 text-xs rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition flex items-center gap-1 border border-transparent hover:border-rose-400/30"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">No period entries logged yet</p>
                <p className="text-xs text-slate-500">
                  Switch to the Calendar View or click "Add Today" to log your first period entry.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
