import React from 'react';
import { Activity, Calculator, Flame } from 'lucide-react';

interface HeaderProps {
  streakDays: number;
  onOpenPaceCalculator: () => void;
  onOpenPeriodTracker: () => void;
  userEmail: string;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakDays,
  onOpenPaceCalculator,
  onOpenPeriodTracker,
  userEmail,
  onSignOut,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Daily Run Tracker</h1>
            <p className="text-xs text-slate-400">1 entry per day · Auto pace &amp; persistent storage</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {streakDays > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streakDays} Day Streak</span>
            </div>
          )}

          <button
            onClick={onOpenPaceCalculator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pace Calculator</span>
          </button>

          <button
            onClick={onOpenPeriodTracker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-900/60 transition shadow-sm hover:border-rose-700"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Period Tracker</span>
          </button>
          <div className="hidden lg:block max-w-40 truncate text-xs text-slate-400" title={userEmail}>
            {userEmail}
          </div>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};
