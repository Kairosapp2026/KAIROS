import { useMemo, useState } from 'react';
import { adaptSession, type Day, type Duration, type Pain, type Track } from '../../core';
import { WEEKS, RULES, CYCLES, LEVELS } from '../../data/mockData';
import { isDemo } from '../../lib/supabase';

// TODO (Paso 2 del README): cuando isDemo sea false, cargar dia y reglas
// desde Supabase con la query del documento de arquitectura. El formato
// de datos es identico, asi que el resto del hook no cambia.

export function useTodaySession(track: Track, level: string) {
  const dow = new Date().getDay();
  const day: Day | null = WEEKS[track].find((d) => d.dow === dow) ?? null;

  const [duration, setDuration] = useState<Duration | null>(null);
  const [pains, setPains] = useState<Pain[]>([]);
  const [logs, setLogs] = useState<Record<string, { done: boolean; value: string; comment: string }>>({});

  const session = useMemo(
    () => (day && duration ? adaptSession(day.blocks, duration, pains, RULES, level) : null),
    [day, duration, pains, level],
  );

  const logBlock = (blockId: string, patch: Partial<{ done: boolean; value: string; comment: string }>) =>
    setLogs((prev) => ({
      ...prev,
      [blockId]: { ...(prev[blockId] ?? { done: false, value: '', comment: '' }), ...patch },
    }));

  return {
    demo: isDemo,
    day,
    cycle: CYCLES[track],
    levels: LEVELS[track],
    duration, setDuration,
    pains, setPains,
    session,
    logs, logBlock,
  };
}
