import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { WEEKS } from '../../data/mockData';
import { ZONES } from '../../core';

interface Athlete {
  id: string;
  display_name: string;
  track: string;
  level: string | null;
  role: string | null;
  created_at: string;
}
interface LogRow { block_id: string; done: boolean; value: string | null; comment: string | null; created_at: string }
interface StatusRow { track: string; dow: number; status: string }
interface CheckinRow { track: string; dow: number; duration: string; pains: { zone: string; type: string }[]; created_at: string }

const DAY_LETTER = ['', 'L', 'M', 'X', 'J', 'V', 'S'];
const PAIN_LABEL: Record<string, string> = { calentar: 'al calentar', final: 'rango final', carga: 'en carga' };
const zoneName = (id: string) => ZONES.find((z) => z.id === id)?.name ?? id;

const BLOCK_INFO: Record<string, { label: string; dow: number }> = {};
for (const tk of ['CF', 'HX'] as const) {
  for (const d of WEEKS[tk]) {
    for (const b of d.blocks) BLOCK_INFO[b.id] = { label: b.name ?? b.format, dow: d.dow };
  }
}
const blockLabel = (id: string) => {
  const info = BLOCK_INFO[id];
  return info ? DAY_LETTER[info.dow] + ' - ' + info.label : id;
};

export function CoachPanel() {
  const sb = supabase!;
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  useEffect(() => {
    sb.from('profiles')
      .select('id, display_name, track, level, role, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setAthletes((data as Athlete[]) ?? []);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLogs(null);
    sb.from('session_logs')
      .select('block_id, done, value, comment, created_at')
      .eq('user_id', selected.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLogs((data as LogRow[]) ?? []));
    sb.from('day_status')
      .select('track, dow, status')
      .eq('user_id', selected.id)
      .then(({ data }) => setStatuses((data as StatusRow[]) ?? []));
    sb.from('checkins')
      .select('track, dow, duration, pains, created_at')
      .eq('user_id', selected.id)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setCheckins((data as CheckinRow[]) ?? []));
  }, [selected]);

  if (error)
    return <main className="screen"><p className="formerror">Error cargando atletas: {error}</p></main>;
  if (!athletes)
    return <main className="screen"><p className="muted">Cargando atletas...</p></main>;

  /* ---------- Ficha de atleta ---------- */
  if (selected) {
    const stFor = (d: number) =>
      statuses.find((s) => s.track === selected.track && s.dow === d)?.status ?? null;
    const marcas = (logs ?? []).filter((l) => l.value);
    const comentarios = (logs ?? []).filter((l) => l.comment);
    const conMolestias = checkins.filter((c) => c.pains && c.pains.length > 0);

    return (
      <main className="screen">
        <button className="link" onClick={() => setSelected(null)}>Volver a atletas</button>
        <h1 style={{ marginTop: 8 }}>{selected.display_name}</h1>
        <p className="muted">
          {selected.track === 'HX' ? 'HYROX' : 'CrossFit'}
          {selected.level ? ' - ' + selected.level : ''}
          {' - alta: ' + new Date(selected.created_at).toLocaleDateString('es-ES')}
        </p>

        <p className="eyebrow" style={{ marginTop: 18 }}>Su semana</p>
        <div className="coachweek">
          {[1, 2, 3, 4, 5, 6].map((d) => {
            const st = stFor(d);
            return (
              <div key={d} className={`coachday ${st === 'done' ? 'ok' : st === 'partial' ? 'part' : ''}`}>
                {DAY_LETTER[d]}
              </div>
            );
          })}
        </div>

        <p className="eyebrow" style={{ marginTop: 22 }}>Molestias declaradas</p>
        {conMolestias.length === 0 && <p className="muted">Sin molestias declaradas.</p>}
        {conMolestias.map((c, i) => (
          <div key={i} className="option" style={{ cursor: 'default' }}>
            <strong>{new Date(c.created_at).toLocaleDateString('es-ES')} - {DAY_LETTER[c.dow]} - {c.duration}</strong>
            <span>{c.pains.map((p) => zoneName(p.zone) + ' (' + (PAIN_LABEL[p.type] ?? p.type) + ')').join(' - ')}</span>
          </div>
        ))}

        <p className="eyebrow" style={{ marginTop: 22 }}>Marcas</p>
        {logs === null && <p className="muted">Cargando...</p>}
        {logs !== null && marcas.length === 0 && <p className="muted">Aun no ha registrado marcas.</p>}
        {marcas.map((l) => (
          <div key={l.block_id} className="option" style={{ cursor: 'default' }}>
            <strong>{blockLabel(l.block_id)}</strong>
            <span>{l.value}{l.done ? ' - completado' : ''}</span>
          </div>
        ))}

        <p className="eyebrow" style={{ marginTop: 22 }}>Comentarios</p>
        {logs !== null && comentarios.length === 0 && <p className="muted">Sin comentarios.</p>}
        {comentarios.map((l) => (
          <div key={l.block_id + '-c'} className="option" style={{ cursor: 'default' }}>
            <strong>{blockLabel(l.block_id)}</strong>
            <span>"{l.comment}"</span>
          </div>
        ))}
      </main>
    );
  }

  /* ---------- Roster ---------- */
  return (
    <main className="screen">
      <p className="eyebrow">Panel de coach</p>
      <h1>Tus atletas</h1>
      <p className="muted">
        {athletes.length} {athletes.length === 1 ? 'perfil registrado' : 'perfiles registrados'}.
        Toca un atleta para ver su actividad.
      </p>
      {athletes.map((a) => (
        <button key={a.id} className="option" onClick={() => setSelected(a)}>
          <strong>
            {a.display_name}
            {a.role === 'coach' && <em className="badge ok" style={{ marginLeft: 8 }}>COACH</em>}
          </strong>
          <span>
            {a.track === 'HX' ? 'HYROX' : 'CrossFit'}
            {a.level ? ' - ' + a.level : ' - sin nivel elegido aun'}
            {' - alta: ' + new Date(a.created_at).toLocaleDateString('es-ES')}
          </span>
        </button>
      ))}
    </main>
  );
}
