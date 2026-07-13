import { useMemo, useState } from 'react';
import { adaptSession, type Day, type Duration, type Pain, type Track } from '../../core';
import { WEEKS, RULES, CYCLES, LEVELS } from '../../data/mockData';

export function useTodaySession(track: Track, level: string, dow: number | null) {
  const day: Day | null = dow ? WEEKS[track].find((d) => d.dow === dow) ?? null : null;

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
      [blockId]: { done: false, value: '', comment: '', ...prev[blockId], ...patch },
    }));

  return {
    week: WEEKS[track],
    day,
    cycle: CYCLES[track],
    levels: LEVELS[track],
    duration, setDuration,
    pains, setPains,
    session,
    logs, logBlock,
  };
}
