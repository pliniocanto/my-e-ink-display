import { useEffect, useState } from 'react';

export function useCountdown(totalSeconds: number): string {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
    const id = setInterval(() => {
      setRemaining(r => (r <= 1 ? totalSeconds : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [totalSeconds]);

  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
