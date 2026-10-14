import React, { useState } from 'react';
import { RunEntry } from '../types/run';
import { Edit2, Search, Trash2 } from 'lucide-react';

interface RunsTableProps {
  runs: RunEntry[];
  editingRunId: string | null;
  onEditRun: (run: RunEntry) => void;
  onRequestDelete: (run: RunEntry) => void;
}

export const RunsTable: React.FC<RunsTableProps> = ({
  runs,
  editingRunId,
  onEditRun,
  onRequestDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sort by day number descending by default
  const sortedRuns = [...runs]
    .filter((r) => {
      const term = searchTerm.toLowerCase();
      return (
        `day ${r.dayNumber}`.includes(term) ||
        r.date.includes(term) ||
        (r.notes || '').toLowerCase().includes(term) ||
        r.distanceKm.toString().includes(term)
      );
    })
    .sort((a, b) => b.dayNumber - a.dayNumber);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Daily History</span>
            <span className="text-xs text-slate-400 font-mono">
              ({runs.length} logged)
            </span>
          </h2>
          <p className="text-xs text-slate-400">Click edit or delete on any day</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search day or date..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {sortedRuns.length > 0 ? (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold font-sans">
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Pace</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-2 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedRuns.map((run) => {
                const isBeingEdited = editingRunId === run.id;
                return (
                  <tr
                    key={run.id}
                    className={`transition ${
                      isBeingEdited
                        ? 'bg-amber-500/10 border-l-2 border-amber-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                        Day {run.dayNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{run.date}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {run.distanceKm} km
                    </td>
                    <td className="py-3 px-3 text-slate-200">{run.timeStr}</td>
                    <td className="py-3 px-3 text-cyan-300 font-semibold">
                      {run.paceStr}
                    </td>
                    <td
                      className="py-3 px-3 text-slate-400 font-sans max-w-[160px] truncate"
                      title={run.notes || ''}
                    >
                      {run.notes || '—'}
                    </td>
                    <td className="py-3 px-2 text-right font-sans whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditRun(run)}
                          title={`Edit Day ${run.dayNumber}`}
                          className="px-2 py-1 text-xs rounded text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(run)}
                          title={`Delete Day ${run.dayNumber}`}
                          className="px-2 py-1 text-xs rounded text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition flex items-center gap-1"
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
        <div className="py-14 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-300">
            {searchTerm ? 'No entries match your search' : 'No running logs yet'}
          </p>
          <p className="text-[11px] text-slate-500">
            {searchTerm ? 'Try a different search term' : 'Fill out the form on the left to record your daily run.'}
          </p>
        </div>
      )}
    </div>
  );
};
