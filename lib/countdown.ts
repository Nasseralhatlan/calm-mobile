import { useEffect, useState } from 'react';

export interface Countdown {
  /** Milliseconds remaining (0 once past the target). */
  ms: number;
  /** `H:MM:SS` (or `M:SS` under an hour). Empty once expired. */
  label: string;
  expired: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

function compute(targetMs: number): Countdown {
  const ms = Math.max(0, targetMs - Date.now());
  if (ms <= 0) return { ms: 0, label: '', expired: true };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const label = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  return { ms, label, expired: false };
}

/** Live countdown to an ISO timestamp, ticking every second. */
export function useCountdown(targetIso: string | null | undefined): Countdown {
  const targetMs = targetIso ? new Date(targetIso).getTime() : NaN;
  const [state, setState] = useState<Countdown>(() =>
    Number.isFinite(targetMs) ? compute(targetMs) : { ms: 0, label: '', expired: true },
  );

  useEffect(() => {
    if (!Number.isFinite(targetMs)) {
      setState({ ms: 0, label: '', expired: true });
      return;
    }
    setState(compute(targetMs));
    if (targetMs <= Date.now()) return;
    const id = setInterval(() => {
      const next = compute(targetMs);
      setState(next);
      if (next.expired) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return state;
}
