import React, { useState, useEffect } from 'react';
import { RunEntry } from '../types/run';
import { calculatePace, parseTimeToSeconds } from '../utils/pace';
import { AlertCircle, Calendar, CheckCircle2, Clock, Edit2, MapPin, Plus, Sparkles, TrendingUp, X } from 'lucide-react';

interface RunFormProps {
  onAddRun: (run: Omit<RunEntry, 'id' | 'createdAt'>) => void;
  onUpdateRun: (id: string, run: Omit<RunEntry, 'id' | 'createdAt'>) => void;
  editingRun: RunEntry | null;
  onCancelEdit: () => void;
  nextDayNumber: number;
}

export const RunForm: React.FC<RunFormProps> = ({
  onAddRun,
  onUpdateRun,
  editingRun,
  onCancelEdit,
  nextDayNumber,
}) => {
  const [dayNumber, setDayNumber] = useState<number>(nextDayNumber);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [distanceKm, setDistanceKm] = useState<string>('5.0');
  const [timeInput, setTimeInput] = useState<string>('27:30');
  const [notes, setNotes] = useState<string>('');
  const [livePace, setLivePace] = useState<string>('5:30 /km');
  const [liveSpeed, setLiveSpeed] = useState<number>(10.91);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // When editingRun changes, populate form or reset to default
  useEffect(() => {
    if (editingRun) {
      setDayNumber(editingRun.dayNumber);
      setDate(editingRun.date);
      setDistanceKm(editingRun.distanceKm.toString());
      setTimeInput(editingRun.timeStr);
      setNotes(editingRun.notes || '');
      setErrorNotice(null);
    } else {
      setDayNumber(nextDayNumber);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrorNotice(null);
    }
  }, [editingRun, nextDayNumber]);

  // Recalculate live pace when distance or time changes
  useEffect(() => {
    const dist = parseFloat(distanceKm);
    const secs = parseTimeToSeconds(timeInput);
    if (dist > 0 && secs > 0) {
      const result = calculatePace(dist, secs);
      setLivePace(result.paceStr);
      setLiveSpeed(result.speedKmh);
    } else {
      setLivePace('--:-- /km');
      setLiveSpeed(0);
    }
  }, [distanceKm, timeInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      setErrorNotice('Please enter a valid distance in kilometers (e.g. 5.0).');
      return;
    }

    const totalSeconds = parseTimeToSeconds(timeInput);
    if (totalSeconds <= 0) {
      setErrorNotice('Please enter a valid running time (e.g. "27:30" or "25").');
      return;
    }

    const { paceStr, paceSeconds, speedKmh } = calculatePace(dist, totalSeconds);

    const runData: Omit<RunEntry, 'id' | 'createdAt'> = {
      dayNumber: Number(dayNumber),
      date,
      distanceKm: dist,
      timeStr: timeInput.trim(),
      durationSeconds: totalSeconds,
      paceStr,
      paceSeconds,
      speedKmh,
      notes: notes.trim() || undefined,
    };

    if (editingRun) {
      onUpdateRun(editingRun.id, runData);
      setNotice(`Updated Day ${dayNumber} successfully!`);
    } else {
      onAddRun(runData);
      setNotice(`Day ${dayNumber} logged successfully!`);
      setNotes('');
    }

    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-colors ${
      editingRun ? 'border-amber-500/50 bg-slate-900/95 ring-1 ring-amber-500/20' : 'border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {editingRun ? (
              <>
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Day {dayNumber}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Log Daily Run</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            {editingRun ? 'Modify your run details below' : 'Record 1 entry for today'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {editingRun && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
            editingRun
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            Day {dayNumber}
          </span>
        </div>
      </div>

      {notice && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Day Number and Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Day Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono text-slate-500">
                Day
              </span>
              <input
                type="number"
                min="1"
                required
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Date</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Distance in KMs */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Distance (KMs)</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.1"
              required
              placeholder="5.0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-mono text-slate-500">
              km
            </span>
          </div>
        </div>

        {/* Time Spent */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Time Spent</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">e.g. 28:30 or 25</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 28:30"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Live Auto Pace Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculated Pace:</span>
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {livePace}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
            <span className="text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>Speed:</span>
            </span>
            <span className="font-mono text-cyan-300">
              {liveSpeed > 0 ? `${liveSpeed} km/h` : '-- km/h'}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Notes / Route (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Morning run, easy pace..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-md active:scale-[0.99] flex items-center justify-center gap-2 ${
            editingRun
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          {editingRun ? (
            <>
              <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Update Day {dayNumber} Entry</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save Day {dayNumber} Entry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
