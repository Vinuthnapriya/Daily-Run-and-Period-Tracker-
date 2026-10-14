import React from 'react';
import { RunStats } from '../types/run';
import { Compass, Flame, Gauge, Route, Timer } from 'lucide-react';
import { formatSecondsToTime } from '../utils/pace';

interface StatsCardsProps {
  stats: RunStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Distance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total KMs</span>
          <Route className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalDistanceKm}
          </span>
          <span className="text-xs text-slate-400 font-mono">km</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Across all running days</p>
      </div>

      {/* Days Logged */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Days Logged</span>
          <Compass className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {stats.totalRuns}
          </span>
          <span className="text-xs text-slate-400 font-mono">sessions</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">1 record per day</p>
      </div>

      {/* Average Pace */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Average Pace</span>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
            {stats.averagePaceStr.replace(' /km', '')}
          </span>
          <span className="text-xs text-slate-400 font-mono">/km</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Overall average pace</p>
      </div>

      {/* Total Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
          <Timer className="w-4 h-4 text-teal-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono">
            {formatSecondsToTime(stats.totalDurationSeconds)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Duration spent running</p>
      </div>

      {/* Longest Run / Streak */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {stats.currentStreakDays}
          </span>
          <span className="text-xs text-slate-400 font-mono">days</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Best distance: {stats.longestRunKm} km
        </p>
      </div>
    </div>
  );
};
