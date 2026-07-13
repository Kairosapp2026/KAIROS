import { useMemo, useState } from 'react';
import { adaptSession, type Day, type Duration, type Pain, type Track } from '../../core';
import { WEEKS, RULES, CYCLES, LEVELS } from '../../data/mockData';

interface BlockLog { done: boolean; value: string; comment: string }
const EMPTY_LOG: BlockLog = { done: false, value: '', comment: '' };
export type DayStatus = 'done' | 'partial';

const load = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
};

export function useTodaySession(track: Track, level: string, dow: number | null) {
  const day: Day | null = dow ? WEEKS[track].find((d) => d.dow === dow) ?? null : null;

  const [duration, setDuration] = useState<Duration | null>(null);
  const [pains, setPains] = useState<Pain[]>([]);
  const [logs, setLogs] = useState<Record<string, BlockLog>>(() => load('kairos-logs'));
  const [statuses, setStatuses] = useState<Record<string, DayStatus>>(() => load('kairos-daystatus'));

  const session = useMemo(
    () => (day && duration ? adaptSession(day.blocks, duration, pains, RULES, level) : null),
    [day, duration, pains, level],
  );

  const statusKey = (d: number) => track + '-' + d;
  const dayStatus = (d: number): DayStatus | null => statuses[statusKey(d)] ?? null;

  const setStatus = (d: number, st: DayStatus) => {
    setStatuses((prev) => {
      if (st === 'partial' && prev[statusKey(d)] === 'done') return prev;
      const next = { ...prev, [statusKey(d)]: st };
      try { localStorage.setItem('kairos-daystatus', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const logBlock = (blockId: string, patch: Partial<BlockLog>) => {
    setLogs((prev) => {
      const base: BlockLog = prev[blockId] ?? EMPTY_LOG;
      const next = { ...prev, [blockId]: { ...base, ...patch } };
      try { localStorage.setItem('kairos-logs', JSON.stringify(next)); } catch {}
      return next;
    });
    if (dow) setStatus(dow, 'partial');
  };

  const finishDay = () => { if (dow) setStatus(dow, 'done'); };

  return {
    week: WEEKS[track],
    day,
    cycle: CYCLES[track],
    levels: LEVELS[track],
    duration, setDuration,
    pains, setPains,
    session,
    logs, logBlock,
    dayStatus, finishDay,
  };
}
