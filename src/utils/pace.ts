/**
 * Calculates running pace (min:sec per km) and speed (km/h)
 */

export function parseTimeToSeconds(input: string): number {
  if (!input) return 0;
  const trimmed = input.trim();

  // If input is purely a number (like "25" or "25.5"), treat as minutes
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.round(parseFloat(trimmed) * 60);
  }

  // If input is in format "MM:SS" or "HH:MM:SS"
  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

export function formatSecondsToTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function calculatePace(distanceKm: number, durationSeconds: number): {
  paceStr: string;
  paceSeconds: number;
  speedKmh: number;
} {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return { paceStr: '--:--', paceSeconds: 0, speedKmh: 0 };
  }

  const secondsPerKm = durationSeconds / distanceKm;
  const paceMinutes = Math.floor(secondsPerKm / 60);
  const paceSeconds = Math.round(secondsPerKm % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const paceStr = `${paceMinutes}:${pad(paceSeconds)} /km`;
  const speedKmh = parseFloat(((distanceKm / durationSeconds) * 3600).toFixed(2));

  return {
    paceStr,
    paceSeconds: Math.round(secondsPerKm),
    speedKmh,
  };
}

export function formatPaceFromSeconds(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}
