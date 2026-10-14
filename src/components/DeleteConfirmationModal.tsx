import React from 'react';
import { RunEntry } from '../types/run';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  run: RunEntry | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  run,
  onConfirm,
  onCancel,
}) => {
  if (!run) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Delete Day {run.dayNumber}?</h3>
            <p className="text-xs text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 my-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Date:</span>
            <span className="font-mono text-slate-200">{run.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Distance:</span>
            <span className="font-mono text-white font-semibold">{run.distanceKm} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Time &amp; Pace:</span>
            <span className="font-mono text-cyan-300">{run.timeStr} ({run.paceStr})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
          >
            Delete Entry
          </button>
        </div>
      </div>
    </div>
  );
};
