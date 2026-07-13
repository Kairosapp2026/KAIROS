import { useState } from 'react';
import type { Duration, Pain, Track } from '../../core';
import { MOBILITY, PAIN_TYPES, ZONES } from '../../core';
import { useTodaySession } from './useTodaySession';

type Step = 'week' | 'level' | 'duration' | 'pain' | 'session';
const PAIN_LABEL: Record<string, string> = { calentar: 'al calentar', final: 'rango final', carga: 'en carga' };
const zoneName = (id: string) => ZONES.find((z) => z.id === id)?.name ?? id;

const LEVEL_DESC: Record<string, string> = {
  ESCALADO: 'Movimientos adaptados y cargas tecnicas.',
  INTERMEDIO: 'Tecnica dominada, capacidad en construccion.',
  RX: 'Cargas y movimientos prescritos.',
  ELITE: 'Volumen e intensidad de competicion.',
  OPEN: 'Division individual, cargas oficiales Open.',
  PRO: 'Division Pro, cargas oficiales Pro.',
};

interface Props {
  track: Track;
  level: string | null;
  levels: string[];
  onLevelChange: (l: string) => void;
}

export function TodaySession({ track, level, levels, onLevelChange }: Props) {
  const [dow, setDow] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('week');
  const [pendingZone, setPendingZone] = useState<string | null>(null);
  const t = useTodaySession(track, level ?? levels[0], dow);
  const todayDow = new Date().getDay();

  const goWeek = () => { setStep('week'); setDow(null); t.setDuration(null); t.setPains([]); };
  const pickDay = (d: number) => { setDow(d); t.setDuration(null); t.setPains([]); setStep('level'); };

  /* ---------- Semana completa ---------- */
  if (step === 'week' || !t.day)
    return (
      <main className="screen">
        <p className="eyebrow">Semana {t.cycle.week} de {t.cycle.totalWeeks} - {t.cycle.block}</p>
        <h1>Tu semana</h1>
        <p className="muted">{t.cycle.goal}</p>
        {t.week.map((d) => (
          <button key={d.dow} className={`option ${d.dow === todayDow ? 'active' : ''}`} onClick={() => pickDay(d.dow)}>
            <strong>{d.name}{d.dow === todayDow ? ' - HOY' : ''}</strong>
            <span>{d.focus}</span>
          </button>
        ))}
        <p className="note" style={{ marginTop: 10 }}>
          Empieza por el dia que toque o el que mejor encaje hoy: elegir dia tambien es adaptar el entreno.
        </p>
      </main>
    );

  /* ---------- Paso 1: nivel ---------- */
  if (step === 'level')
    return (
      <main className="screen">
        <p className="eyebrow">{t.day.name} - {t.day.focus} - paso 1 de 3</p>
        <h1>{track === 'HX' ? 'En que division entrenas?' : 'A que nivel entrenas hoy?'}</h1>
        <p className="muted">
          {level ? 'Confirma tu nivel habitual o cambialo solo por hoy.' : 'Elige tu punto de partida. Podras cambiarlo cualquier dia.'}
        </p>
        {levels.map((l) => (
          <button key={l} className={`option ${level === l ? 'active' : ''}`}
            onClick={() => { onLevelChange(l); setStep('duration'); }}>
            <strong>{l}{level === l ? ' - tu nivel habitual' : ''}</strong>
            <span>{LEVEL_DESC[l] ?? ''}</span>
          </button>
        ))}
        <button className="link" onClick={goWeek}>Volver a la semana</button>
      </main>
    );

  /* ---------- Paso 2: tiempo ---------- */
  if (step === 'duration')
    return (
      <main className="screen">
        <p className="eyebrow">{t.day.name} - paso 2 de 3</p>
        <h1>Cuanto tienes hoy?</h1>
        <p className="muted">
          Bloque de {t.cycle.block.toLowerCase()} (semana {t.cycle.week}/{t.cycle.totalWeeks}). Si eliges 1h,
          mantenemos el estimulo del dia y comprimimos lo accesorio.
        </p>
        {(['1h', '2h'] as Duration[]).map((d) => (
          <button key={d} className="option" onClick={() => { t.setDuration(d); setStep('pain'); }}>
            <strong>{d === '1h' ? '1 hora' : '2 horas'}</strong>
            <span>{d === '1h' ? 'Nucleo del dia: lo innegociable.' : 'Sesion completa con complementario y extra.'}</span>
          </button>
        ))}
        <button className="link" onClick={() => setStep('level')}>Cambiar nivel</button>
      </main>
    );

  /* ---------- Paso 3: molestias ---------- */
  if (step === 'pain')
    return (
      <main className="screen">
        <p className="eyebrow">{t.day.name} - paso 3 de 3</p>
        <h1>Alguna molestia hoy?</h1>
        <p className="muted">Adaptamos ejercicios y anadimos movilidad dirigida al final.</p>
        {!pendingZone ? (
          <>
            <div className="grid2">
              {ZONES.map((z) => {
                const active = t.pains.find((p) => p.zone === z.id);
                return (
                  <button key={z.id} className={`option small ${active ? 'active' : ''}`}
                    onClick={() => active ? t.setPains(t.pains.filter((p) => p.zone !== z.id)) : setPendingZone(z.id)}>
                    <strong>{z.name}</strong>
                    {active && <span className="accent">{PAIN_LABEL[active.type]} - toca para quitar</span>}
                  </button>
                );
              })}
            </div>
            <button className="cta" onClick={() => setStep('session')}>
              {t.pains.length ? 'Adaptar mi entreno' : 'Sin molestias - Ver entreno'}
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">{zoneName(pendingZone)} - cuando molesta?</p>
            {PAIN_TYPES.map((pt) => (
              <button key={pt.id} className="option" onClick={() => {
                t.setPains([...t.pains, { zone: pendingZone, type: pt.id } as Pain]);
                setPendingZone(null);
              }}>
                <strong>{pt.name}</strong><span>{pt.desc}</span>
              </button>
            ))}
            <button className="link" onClick={() => setPendingZone(null)}>Cancelar</button>
          </>
        )}
      </main>
    );

  /* ---------- Sesion adaptada ---------- */
  const s = t.session!;
  return (
    <main className="screen">
      <p className="eyebrow">{t.day.name} - Semana {t.cycle.week}/{t.cycle.totalWeeks} - {t.cycle.block} - {level}</p>
      <h1>{t.day.focus}</h1>
      <p className="why">{t.day.why}</p>

      {s.needsActivation.length > 0 && (
        <aside className="notice warn">
          Molestia solo al calentar en {s.needsActivation.map(zoneName).join(' y ')}: anade 6-8 min de
          activacion especifica antes de empezar. Movilidad dirigida incluida al final.
        </aside>
      )}

      {s.blocks.filter((b) => b.visible).map((b) => {
        const log = t.logs[b.id] ?? { done: false, value: '', comment: '' };
        return (
          <section key={b.id} className={`block ${log.done ? 'done' : ''}`}>
            <header>
              <span className="format">{b.format.replace('_', ' ')}</span>
              <span className={`tag ${b.tag.toLowerCase()}`}>{b.tag}</span>
              <button className={`check ${log.done ? 'on' : ''}`} aria-label="Completar bloque"
                onClick={() => t.logBlock(b.id, { done: !log.done })}>OK</button>
            </header>
            {b.name && <h2>{b.name}</h2>}
            {b.scheme && <p className="scheme">{b.scheme}</p>}
            <ul>
              {b.lines.map((l, i) => (
                <li key={i}>
                  {l.text}
                  {l.adapted && (
                    <div className="adapted">
                      ADAPTADO - {zoneName(l.adapted.zone)} {PAIN_LABEL[l.adapted.type]} - sustituye a{' '}
                      {l.adapted.original} ({l.adapted.note})
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {b.note && <p className="note">{b.note}</p>}
            {b.logType && (
              <input className="loginput"
                placeholder={b.logType === 'peso' ? 'Carga usada - ej. 5x5 @ 100 kg'
                  : b.logType === 'tiempo' ? 'Tiempo - ej. 8:42' : 'Rondas + reps - ej. 6+14'}
                value={log.value}
                onChange={(e) => t.logBlock(b.id, { value: e.target.value })} />
            )}
            <textarea className="loginput" rows={1} placeholder="Comentario - como lo has sentido?"
              value={log.comment}
              onChange={(e) => t.logBlock(b.id, { comment: e.target.value })} />
          </section>
        );
      })}

      {s.omittedCount > 0 && (
        <p className="notice">
          {s.omittedCount} bloque(s) complementario(s) omitido(s) por tiempo. El estimulo clave esta intacto.{' '}
          <button className="link" onClick={() => t.setDuration('2h')}>Ver sesion completa</button>
        </p>
      )}

      {s.mobilityZones.length > 0 && (
        <section className="block mobility">
          <header><span className="format">MOVILIDAD FINAL DIRIGIDA</span></header>
          {s.mobilityZones.map((z) => (
            <div key={z}>
              <h3>{zoneName(z)} - 8-10 min</h3>
              <ul>{(MOBILITY[z] ?? []).map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          ))}
          <p className="note">Si la molestia se repite 3 o mas dias seguidos, comentalo con un profesional.</p>
        </section>
      )}

      <button className="link" onClick={goWeek}>Volver a la semana</button>
    </main>
  );
}
