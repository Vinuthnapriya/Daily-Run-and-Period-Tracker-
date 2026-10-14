import React, { useState } from 'react';
import { RunEntry } from '../types/run';
import { Activity, BarChart2, TrendingUp } from 'lucide-react';

interface ProgressChartsProps {
  runs: RunEntry[];
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ runs }) => {
  const [metric, setMetric] = useState<'distance' | 'pace'>('distance');

  // Sort chronologically by dayNumber
  const sortedRuns = [...runs].sort((a, b) => a.dayNumber - b.dayNumber);

  if (sortedRuns.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
        <p className="text-xs text-slate-400">
          Log at least 2 days to visualize your distance and pace trend charts!
        </p>
      </div>
    );
  }

  const chartHeight = 160;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 25;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Data ranges
  const maxDistance = Math.max(...sortedRuns.map((r) => r.distanceKm), 5);
  const minDistance = 0;

  const paceValues = sortedRuns.map((r) => r.paceSeconds).filter((p) => p > 0);
  const maxPace = paceValues.length > 0 ? Math.max(...paceValues) : 400;
  const minPace = paceValues.length > 0 ? Math.min(...paceValues) : 240;

  // Points calculation
  const points = sortedRuns.map((r, i) => {
    const x =
      sortedRuns.length === 1
        ? paddingX + innerWidth / 2
        : paddingX + (i / (sortedRuns.length - 1)) * innerWidth;

    let y = 0;
    if (metric === 'distance') {
      const normalized = (r.distanceKm - minDistance) / (maxDistance - minDistance || 1);
      y = chartHeight - paddingY - normalized * innerHeight;
    } else {
      // Faster pace (lower seconds) is higher on graph
      const normalized = (maxPace - r.paceSeconds) / (maxPace - minPace || 1);
      y = chartHeight - paddingY - normalized * innerHeight;
    }

    return { x, y, run: r };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaData = `${pathData} L ${points[points.length - 1].x.toFixed(1)} ${
    chartHeight - paddingY
  } L ${points[0].x.toFixed(1)} ${chartHeight - paddingY} Z`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Progress Trend</span>
          </h3>
          <p className="text-xs text-slate-400">
            {metric === 'distance'
              ? 'Distance (km) recorded across your daily sessions'
              : 'Pace trend (higher is faster /km)'}
          </p>
        </div>

        {/* Metric Segmented Control */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMetric('distance')}
            className={`px-3 py-1 rounded-md transition ${
              metric === 'distance'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Distance (km)
          </button>
          <button
            onClick={() => setMetric('pace')}
            className={`px-3 py-1 rounded-md transition ${
              metric === 'pace'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pace (/km)
          </button>
        </div>
      </div>

      <div className="mt-4 w-full">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight / 2}
            x2={chartWidth - paddingX}
            y2={chartHeight / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#334155"
          />

          {/* Area Fill */}
          <path d={areaData} fill="url(#areaGradient)" />

          {/* Main Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={p.run.id} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#0f172a"
                stroke="#10b981"
                strokeWidth="2.5"
                className="transition-all duration-200 group-hover:r-6 group-hover:fill-emerald-400"
              />
              {/* Day label */}
              <text
                x={p.x}
                y={chartHeight - paddingY + 16}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fill="#94a3b8"
              >
                D{p.run.dayNumber}
              </text>
              {/* Value label on point */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fontFamily="monospace"
                fill="#ffffff"
              >
                {metric === 'distance' ? `${p.run.distanceKm}k` : p.run.paceStr.replace(' /km', '')}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1 pt-2 border-t border-slate-800/80">
        <span>Start: Day {sortedRuns[0].dayNumber} ({sortedRuns[0].date})</span>
        <span>Latest: Day {sortedRuns[sortedRuns.length - 1].dayNumber} ({sortedRuns[sortedRuns.length - 1].date})</span>
      </div>
    </div>
  );
};
