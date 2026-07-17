import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptSession, type Day, type Duration, type Pain, type Track } from '../../core';
import { WEEKS, RULES, CYCLES, LEVELS } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

interface BlockLog { done: boolean; value: string; comment: string }
const EMPTY_LOG: BlockLog = { done: false, value: '', comment: '' };
export type DayStatus = 'done' | 'partial';

export function useTodaySession(track: Track, level: string, dow: number | null) {
  const sb = supabase;
  const [week, setWeek] = useState<Day[]>(WEEKS[track]);

  useEffect(() => {
    setWeek(WEEKS[track]);
    if (!sb) return;
    sb.from('published_weeks')
      .select('data')
      .eq('track', track)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.data) setWeek(data.data as Day[]);
      });
  }, [track]);

  const day: Day | null = dow ? week.find((d) => d.dow === dow) ?? null : null;

  const [userId, setUserId] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [pains, setPains] = useState<Pain[]>([]);
  const [logs, setLogs] = useState<Record<string, BlockLog>>({});
  const [statuses, setStatuses] = useState<Record<string, DayStatus>>({});
  const checkinSent = useRef<string | null>(null);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!sb || !userId) return;
    sb.from('session_logs')
      .select('block_id, done, value, comment')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, BlockLog> = {};
        for (const r of data) map[r.block_id] = { done: !!r.done, value: r.value ?? '', comment: r.comment ?? '' };
        setLogs(map);
      });
    sb.from('day_status')
      .select('track, dow, status')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, DayStatus> = {};
        for (const r of data) map[r.track + '-' + r.dow] = r.status as DayStatus;
        setStatuses(map);
      });
  }, [userId]);

  const session = useMemo(
    () => (day && duration ? adaptSession(day.blocks, duration, pains, RULES, level) : null),
    [day, duration, pains, level],
  );

  const confirmCheckin = () => {
    if (!sb || !userId || !dow || !duration) return;
    const key = track + '-' + dow + '-' + new Date().toDateString();
    if (checkinSent.current === key) return;
    checkinSent.current = key;
    sb.from('checkins')
      .insert({ user_id: userId, track, dow, duration, pains })
      .then(() => {});
  };

  const statusKey = (d: number) => track + '-' + d;
  const dayStatus = (d: number): DayStatus | null => statuses[statusKey(d)] ?? null;

  const setStatus = (d: number, st: DayStatus) => {
    const key = statusKey(d);
    if (st === 'partial' && statuses[key] === 'done') return;
    setStatuses((prev) => ({ ...prev, [key]: st }));
    if (sb && userId) {
      sb.from('day_status')
        .upsert({ user_id: userId, track, dow: d, status: st }, { onConflict: 'user_id,track,dow' })
        .then(() => {});
    }
  };

  const logBlock = (blockId: string, patch: Partial<BlockLog>) => {
    const base: BlockLog = logs[blockId] ?? EMPTY_LOG;
    const merged: BlockLog = { ...base, ...patch };
    setLogs((prev) => ({ ...prev, [blockId]: merged }));
    if (sb && userId) {
      sb.from('session_logs')
        .upsert(
          { user_id: userId, block_id: blockId, done: merged.done, value: merged.value, comment: merged.comment },
          { onConflict: 'user_id,block_id' },
        )
        .then(() => {});
    }
    if (dow) setStatus(dow, 'partial');
  };

  const finishDay = () => { if (dow) setStatus(dow, 'done'); };

  return {
    week,
    day,
    cycle: CYCLES[track],
    levels: LEVELS[track],
    duration, setDuration,
    pains, setPains,
    session,
    logs, logBlock,
    dayStatus, finishDay, confirmCheckin,
  };
}
