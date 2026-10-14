import React, { useState } from 'react';
import { calculatePace } from '../utils/pace';
import { Calculator, X } from 'lucide-react';

interface PaceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaceCalculatorModal: React.FC<PaceCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [targetDist, setTargetDist] = useState<number>(5);
  const [targetHours, setTargetHours] = useState<number>(0);
  const [targetMins, setTargetMins] = useState<number>(25);
  const [targetSecs, setTargetSecs] = useState<number>(0);

  if (!isOpen) return null;

  const totalSeconds = targetHours * 3600 + targetMins * 60 + targetSecs;
  const { paceStr, speedKmh } = calculatePace(targetDist, totalSeconds);

  const commonDistances = [
    { label: '3K', km: 3 },
    { label: '5K', km: 5 },
    { label: '10K', km: 10 },
    { label: 'Half Marathon (21.1 km)', km: 21.0975 },
    { label: 'Marathon (42.2 km)', km: 42.195 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Target Pace Calculator</h3>
            <p className="text-xs text-slate-400">Calculate required pace & speed for any goal</p>
          </div>
        </div>

        {/* Distance Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Distance (Kilometers)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={targetDist}
                onChange={(e) => setTargetDist(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 font-mono">
                km
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {commonDistances.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setTargetDist(d.km)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition font-mono ${
                    targetDist === d.km
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Finish Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={targetHours}
                  onChange={(e) => setTargetHours(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={targetMins}
                  onChange={(e) => setTargetMins(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={targetSecs}
                  onChange={(e) => setTargetSecs(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Required Pace:</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {paceStr}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-850">
              <span className="text-slate-400">Target Speed:</span>
              <span className="font-mono text-cyan-300 font-semibold">{speedKmh} km/h</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-850">
              <span className="text-slate-400">Kilometer split:</span>
              <span className="font-mono text-slate-300">{paceStr.replace(' /km', '')} per km</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Close Calculator
        </button>
      </div>
    </div>
  );
};
