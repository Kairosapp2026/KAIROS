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

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  x.setHours(0, 0, 0, 0);
  return x;
}
const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  const end = addDays(d, 5);
  const f = (x: Date) => x.getDate() + ' ' + x.toLocaleDateString('es-ES', { month: 'short' });
  return f(d) + ' - ' + f(end);
};
const DAY_FULL = ['', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const VALID_TAGS = ['NUCLEO', 'COMPLEMENTARIO', 'EXTRA'];

const FORMATS = ['FUERZA', 'HALTEROFILIA', 'SKILL', 'AMRAP', 'EMOM', 'FOR_TIME', 'INTERVALOS', 'ACCESORIO', 'TEAM', 'RECUPERACION'];
const LEVEL_KEYS = ['ESCALADO', 'INTERMEDIO', 'RX', 'ELITE', 'OPEN', 'PRO'];

const AUTO_TAGS: [RegExp, string[]][] = [
  // --- Sentadilla y derivados ---
  [/back squat|sentadilla trasera/i, ['squat', 'raquis_carga']],
  [/front squat|sentadilla frontal/i, ['squat', 'raquis_carga', 'front_rack']],
  [/overhead squat|ohs/i, ['squat', 'push_vertical']],
  [/thruster/i, ['squat', 'push_vertical', 'front_rack']],
  [/wall ?ball/i, ['squat', 'push_vertical']],
  [/pistol/i, ['squat', 'unilateral_rodilla']],
  [/goblet|air squat|sentadilla/i, ['squat']],
  [/box step|step[- ]?over|step[- ]?up/i, ['unilateral_rodilla']],
  [/overhead lunge|zancada overhead|walking lunge overhead/i, ['unilateral_rodilla', 'push_vertical']],
  [/split squat|zancada|lunge|estocada|bulgar/i, ['unilateral_rodilla']],
  [/sandbag lunge|zancada con saco/i, ['unilateral_rodilla', 'raquis_carga']],
  // --- Bisagra y tirones de suelo ---
  [/sumo deadlift high pull|sdhp/i, ['hinge', 'pull_vertical']],
  [/deadlift|peso muerto|rdl|rumano/i, ['hinge', 'raquis_carga']],
  [/good ?morning/i, ['hinge', 'raquis_carga']],
  [/rack pull|hip thrust|puente de gluteo|glute bridge/i, ['hinge']],
  [/back extension|extension lumbar|hip extension|extension de cadera|nordic/i, ['hinge']],
  [/swing/i, ['hinge']],
  [/americana/i, ['push_vertical']],
  // --- Halterofilia ---
  [/devil press|man ?maker/i, ['hinge', 'push_vertical']],
  [/clean and jerk|clean & jerk/i, ['hinge', 'front_rack', 'push_vertical']],
  [/clean|cargada/i, ['hinge', 'front_rack']],
  [/snatch|arrancada/i, ['hinge', 'push_vertical']],
  [/turkish get[- ]?up|tgu|windmill/i, ['push_vertical']],
  // --- Empuje vertical e invertidos ---
  [/jerk|push press|press estricto|strict press|shoulder press|db press|z-press|landmine|arnold/i, ['push_vertical']],
  [/hspu|handstand push/i, ['push_vertical', 'invertido', 'muneca_ext']],
  [/wall walk|handstand|pino/i, ['invertido', 'muneca_ext']],
  [/front rack|rack frontal/i, ['front_rack']],
  // --- Empuje horizontal ---
  [/bench press|press banca|floor press/i, ['push_horizontal']],
  [/push[- ]?up|flexion/i, ['push_horizontal', 'muneca_ext']],
  [/fondos|ring dip|\bdips?\b/i, ['push_horizontal']],
  // --- Tirones y colgados ---
  [/rope climb|cuerda|legless/i, ['colgado', 'pull_vertical', 'grip']],
  [/pegboard/i, ['colgado', 'pull_vertical', 'grip']],
  [/toes to bar|t2b|knee raise|k2e/i, ['colgado', 'core_flexion']],
  [/muscle[- ]?up/i, ['colgado', 'pull_vertical']],
  [/pull[- ]?up|dominada|chin[- ]?up|chest to bar|c2b/i, ['colgado', 'pull_vertical']],
  [/jalon|lat pull/i, ['pull_vertical']],
  [/kipping|colgado|hang/i, ['colgado']],
  [/face pull|pull apart|band pull/i, ['pull_horizontal']],
  [/ring row|remo con anillas|remo invertido|bent over|remo con barra|remo con mancuerna|renegade/i, ['pull_horizontal']],
  // --- Ergometros y monoestructural ---
  [/ski ?erg|\bski\b/i, ['pull_vertical', 'ciclico_bajo']],
  [/\bremo\b|\brow\b|rowing/i, ['pull_horizontal']],
  [/\bbici\b|bike|assault|echo/i, ['ciclico_bajo']],
  [/burpee broad jump|burpee salto/i, ['impacto', 'push_horizontal']],
  [/burpee/i, ['impacto', 'push_horizontal']],
  [/double under|single under|crossover|comba/i, ['impacto']],
  [/box jump|salto al cajon|broad jump|salto/i, ['impacto']],
  [/carrera|correr|\brun\b|sprint|shuttle/i, ['impacto', 'ciclico_alto']],
  // --- Trineos y acarreos (HYROX / strongman) ---
  [/sled push|empuje de trineo|empujar trineo/i, ['squat']],
  [/sled pull|sled drag|arrastre de trineo|arrastrar trineo/i, ['pull_horizontal', 'grip']],
  [/trineo/i, ['squat']],
  [/farmer|acarreo|carry/i, ['grip']],
  [/d[- ]?ball|slam ?ball|ball over shoulder|balon al hombro/i, ['hinge', 'raquis_carga', 'grip']],
  [/sandbag|saco|bear hug/i, ['raquis_carga', 'grip']],
  [/yoke|yugo/i, ['raquis_carga']],
  // --- Core ---
  [/ghd sit|sit[- ]?up|v[- ]?up|crunch|abmat/i, ['core_flexion']],
  [/l[- ]?sit/i, ['core_flexion']],
  // --- Agarre y muneca ---
  [/dead ?hang|colgarse/i, ['colgado', 'grip']],
  [/wrist|muneca/i, ['muneca_ext']],
];

function autoPatterns(text: string): string[] {
  const out: string[] = [];
  for (const [re, pats] of AUTO_TAGS) {
    if (re.test(text)) {
      for (const p of pats) if (!out.includes(p)) out.push(p);
      break;
    }
  }
  return out;
}

const canon = (c: Record<string, string>) => JSON.stringify(Object.fromEntries(Object.entries(c ?? {}).sort()));

function linesToText(b: any): string {
  return (b.lines ?? []).map((l: any) => {
    const c = l.content ?? {};
    const parts: string[] = [];
    if (c['*']) parts.push(c['*']);
    for (const k of LEVEL_KEYS) if (c[k]) parts.push(k + ': ' + c[k]);
    for (const k of Object.keys(c)) if (k !== '*' && !LEVEL_KEYS.includes(k)) parts.push(k + ': ' + c[k]);
    return parts.join(' | ');
  }).join('\n');
}

function textToLines(v: string, prev?: any[]): any[] {
  return v.split('\n').map((raw) => raw.trim()).filter((raw) => raw.length > 0).map((raw, i) => {
    let main = raw;
    let manual: string[] | null = null;
    const di = raw.lastIndexOf('::');
    if (di !== -1) {
      main = raw.slice(0, di).trim();
      manual = raw.slice(di + 2).split(',').map((p) => p.trim()).filter((p) => p);
    }
    const content: Record<string, string> = {};
    for (const seg of main.split('|').map((x) => x.trim()).filter((x) => x)) {
      const m = seg.match(/^([A-Z_]+)\s*:\s*(.+)$/);
      if (m && (LEVEL_KEYS.includes(m[1]) || m[1] === 'TODOS')) {
        content[m[1] === 'TODOS' ? '*' : m[1]] = m[2].trim();
      } else {
        content['*'] = content['*'] ? content['*'] + ' ' + seg : seg;
      }
    }
    let patterns: string[];
    if (manual) {
      patterns = manual;
    } else {
      const kept = (prev ?? []).find((p) => canon(p.content) === canon(content));
      if (kept && kept.patterns && kept.patterns.length) {
        patterns = kept.patterns;
      } else {
        const allText = Object.values(content).join(' ');
        patterns = autoPatterns(allText);
      }
    }
    return { id: 'l' + (i + 1), content, patterns };
  });
}

function validateWeek(text: string): { days?: any[]; error?: string } {
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { return { error: 'El texto no es JSON valido. Asegurate de pegar el bloque completo, de [ a ].' }; }
  if (!Array.isArray(parsed) || parsed.length === 0) return { error: 'Debe ser una lista de dias entre corchetes [ ].' };
  const seen = new Set<number>();
  for (const d of parsed) {
    if (typeof d.dow !== 'number' || d.dow < 1 || d.dow > 6) return { error: 'Cada dia necesita "dow" entre 1 (lunes) y 6 (sabado).' };
    if (seen.has(d.dow)) return { error: 'Dia repetido: ' + DAY_FULL[d.dow] + '.' };
    seen.add(d.dow);
    if (!d.focus) return { error: DAY_FULL[d.dow] + ' no tiene "focus".' };
    if (!Array.isArray(d.blocks) || d.blocks.length === 0) return { error: DAY_FULL[d.dow] + ' no tiene bloques.' };
    for (let i = 0; i < d.blocks.length; i++) {
      const b = d.blocks[i];
      if (!b.id) b.id = 'w' + d.dow + '-' + i;
      if (!VALID_TAGS.includes(b.tag)) return { error: 'Bloque ' + (i + 1) + ' de ' + DAY_FULL[d.dow] + ': tag debe ser NUCLEO, COMPLEMENTARIO o EXTRA.' };
      if (!b.format) return { error: 'Bloque ' + (i + 1) + ' de ' + DAY_FULL[d.dow] + ' no tiene "format".' };
      if (!Array.isArray(b.lines) || b.lines.length === 0) return { error: 'Bloque ' + (b.name ?? b.format) + ' de ' + DAY_FULL[d.dow] + ' no tiene lineas.' };
      for (const l of b.lines) {
        if (!l.content && typeof l.text === 'string' && l.text) {
          l.content = { '*': l.text };
          delete l.text;
        }
        if (!l.content || typeof l.content !== 'object' || Object.values(l.content).filter((v) => typeof v === 'string' && v).length === 0) {
          return { error: 'Hay una linea vacia o sin texto en ' + DAY_FULL[d.dow] + ' (bloque ' + (b.name ?? b.format) + ').' };
        }
        if (!Array.isArray(l.patterns)) l.patterns = [];
        if (!l.id) l.id = 'l' + Math.random().toString(36).slice(2, 7);
      }
    }
  }
  return { days: parsed };
}
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
  const [pub, setPub] = useState<Record<string, string>>({});
  const [pubBusy, setPubBusy] = useState<string | null>(null);
  const [pubMsg, setPubMsg] = useState('');

  const loadPub = () => {
    sb.from('published_weeks').select('track, week_start, updated_at').then(({ data }) => {
      const map: Record<string, string> = {};
      for (const r of (data ?? []) as { track: string; week_start: string; updated_at: string }[]) {
        map[r.track + '|' + r.week_start] = r.updated_at;
      }
      setPub(map);
    });
  };
  useEffect(loadPub, []);

  const [progTrack, setProgTrack] = useState<'CF' | 'HX' | null>(null);
  const [progWeek, setProgWeek] = useState<string | null>(null);
  const [days, setDays] = useState<any[] | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState('');
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [valErr, setValErr] = useState('');

  const mut = (fn: (c: any[]) => void) =>
    setDays((prev) => {
      const c = JSON.parse(JSON.stringify(prev ?? []));
      fn(c);
      return c;
    });

  const openEditor = (tk: 'CF' | 'HX') => {
    setProgTrack(tk);
    setProgWeek(null);
    setValErr('');
    setPubMsg('');
  };

  const openWeek = (tk: 'CF' | 'HX', ws: string) => {
    setProgWeek(ws);
    setValErr('');
    setPubMsg('');
    setEditMode('visual');
    setOpenDay(null);
    setDays(null);
    sb.from('published_weeks').select('data').eq('track', tk).eq('week_start', ws).maybeSingle()
      .then(async ({ data }) => {
        if (data && data.data) { setDays(JSON.parse(JSON.stringify(data.data))); return; }
        const prev = isoDate(addDays(new Date(ws + 'T00:00:00'), -7));
        const { data: prevRow } = await sb.from('published_weeks').select('data').eq('track', tk).eq('week_start', prev).maybeSingle();
        if (prevRow && prevRow.data) {
          setDays(JSON.parse(JSON.stringify(prevRow.data)));
          setPubMsg('Semana nueva: cargada como copia de la anterior. Editala y publica.');
        } else {
          setDays(JSON.parse(JSON.stringify(WEEKS[tk])));
          setPubMsg('Semana nueva: cargada la plantilla base. Editala y publica.');
        }
      });
  };

  const toJsonMode = () => { setJsonText(JSON.stringify(days ?? [], null, 2)); setEditMode('json'); setValErr(''); };

  const importJson = () => {
    setPubMsg('');
    const res = validateWeek(jsonText);
    if (res.error) { setValErr(res.error); return; }
    setValErr('');
    setDays(res.days ?? []);
    setEditMode('visual');
    setPubMsg('Semana importada. Revisala y publica cuando este lista.');
  };

  const publishDays = async () => {
    if (!progTrack || !days) return;
    setPubMsg('');
    const res = validateWeek(JSON.stringify(days));
    if (res.error) { setValErr(res.error); return; }
    setValErr('');
    setPubBusy(progTrack);
    const { error: err } = await sb.from('published_weeks').upsert({
      track: progTrack,
      week_start: progWeek,
      data: res.days,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'track,week_start' });
    setPubBusy(null);
    if (err) setPubMsg('Error al publicar: ' + err.message);
    else { setPubMsg('Semana publicada. Tus atletas ya la ven.'); loadPub(); }
  };

  const publish = async (tk: 'CF' | 'HX') => {
    setPubBusy(tk);
    setPubMsg('');
    const { error: err } = await sb.from('published_weeks').upsert({
      track: tk,
      week_start: isoDate(mondayOf(new Date())),
      data: WEEKS[tk],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'track,week_start' });
    setPubBusy(null);
    if (err) setPubMsg('Error al publicar: ' + err.message);
    else { setPubMsg('Semana de ' + (tk === 'CF' ? 'CrossFit' : 'HYROX') + ' publicada.'); loadPub(); }
  };

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

  /* ---------- Planificador: 8 semanas vista ---------- */
  if (progTrack && !progWeek) {
    const tk = progTrack;
    const thisMonday = mondayOf(new Date());
    const weeks = Array.from({ length: 8 }, (_, i) => isoDate(addDays(thisMonday, i * 7)));
    return (
      <main className="screen">
        <button className="link" onClick={() => setProgTrack(null)}>Volver al panel</button>
        <h1 style={{ marginTop: 8 }}>Planificador {tk === 'CF' ? 'CrossFit' : 'HYROX'}</h1>
        <p className="muted">Las proximas 8 semanas. Toca una para editarla y publicarla.</p>
        {weeks.map((ws, i) => {
          const done = !!pub[tk + '|' + ws];
          return (
            <button key={ws} className={`option ${done ? 'dayok' : ''}`} onClick={() => openWeek(tk, ws)}>
              <strong>
                {i === 0 ? 'Esta semana' : i === 1 ? 'Proxima semana' : 'Semana ' + (i + 1)}
                {done && <em className="badge ok" style={{ marginLeft: 8 }}>PUBLICADA</em>}
              </strong>
              <span>{weekLabel(ws)}{done ? ' - editada el ' + new Date(pub[tk + '|' + ws]).toLocaleDateString('es-ES') : ' - sin programar'}</span>
            </button>
          );
        })}
      </main>
    );
  }

  /* ---------- Editor de programacion ---------- */
  if (progTrack && progWeek) {
    const tk = progTrack;
    return (
      <main className="screen">
        <button className="link" onClick={() => { setProgWeek(null); setDays(null); setValErr(''); setPubMsg(''); }}>
          Volver al planificador
        </button>
        <h1 style={{ marginTop: 8 }}>{tk === 'CF' ? 'CrossFit' : 'HYROX'} - {weekLabel(progWeek)}</h1>
        <p className="muted">
          {pub[tk + '|' + progWeek]
            ? 'Publicada - ultima edicion el ' + new Date(pub[tk + '|' + progWeek]).toLocaleDateString('es-ES')
            : 'Sin publicar todavia.'}
        </p>

        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <button className={'chip ' + (editMode === 'visual' ? 'on' : '')} onClick={() => setEditMode('visual')}>Editar</button>
          <button className={'chip ' + (editMode === 'json' ? 'on' : '')} onClick={toJsonMode}>Codigo IA</button>
          <button className="chip" onClick={() => { setDays(JSON.parse(JSON.stringify(WEEKS[tk]))); setValErr(''); setPubMsg('Semana del codigo cargada.'); }}>
            Restaurar del codigo
          </button>
        </div>

        {editMode === 'json' && (
          <>
            <p className="note">
              Copia este bloque, pideselo modificado a tu IA (mismo formato exacto) y pega aqui el resultado completo.
            </p>
            <textarea className="loginput progjson" rows={12} value={jsonText}
              onChange={(e) => setJsonText(e.target.value)} spellCheck={false} />
            <button className="cta" style={{ marginTop: 10 }} onClick={importJson}>Importar al editor</button>
            {valErr && <p className="formerror">{valErr}</p>}
            {pubMsg && <p className="forminfo">{pubMsg}</p>}
          </>
        )}

        {editMode === 'visual' && !days && <p className="muted">Cargando semana...</p>}

        {editMode === 'visual' && days && (
          <>
            {days.map((d: any, di: number) => (
              <div key={d.dow} className="editday">
                <button className="editdayhead" onClick={() => setOpenDay(openDay === d.dow ? null : d.dow)}>
                  <strong>{DAY_FULL[d.dow]}</strong>
                  <span>{d.focus}</span>
                  <em>{openDay === d.dow ? 'cerrar' : 'editar'}</em>
                </button>

                {openDay === d.dow && (
                  <div className="editdaybody">
                    <label className="editlabel">Foco del dia
                      <input className="loginput" value={d.focus}
                        onChange={(e) => mut((c) => { c[di].focus = e.target.value; })} />
                    </label>
                    <label className="editlabel">Por que hoy esto (lo lee el atleta)
                      <textarea className="loginput" rows={2} value={d.why ?? ''}
                        onChange={(e) => mut((c) => { c[di].why = e.target.value; })} />
                    </label>

                    {d.blocks.map((b: any, bi: number) => (
                      <div key={b.id ?? bi} className="editblock">
                        <div className="editrow">
                          <label className="editlabel half">Etiqueta
                            <select className="loginput" value={b.tag}
                              onChange={(e) => mut((c) => { c[di].blocks[bi].tag = e.target.value; })}>
                              <option value="NUCLEO">NUCLEO</option>
                              <option value="COMPLEMENTARIO">COMPLEMENTARIO</option>
                              <option value="EXTRA">EXTRA</option>
                            </select>
                          </label>
                          <label className="editlabel half">Registro de marca
                            <select className="loginput" value={b.logType ?? ''}
                              onChange={(e) => mut((c) => { c[di].blocks[bi].logType = e.target.value || null; })}>
                              <option value="">Sin registro</option>
                              <option value="peso">Peso</option>
                              <option value="tiempo">Tiempo</option>
                              <option value="rondas">Rondas</option>
                            </select>
                          </label>
                        </div>
                        <div className="editrow">
                          <label className="editlabel half">Formato
                            <select className="loginput" value={b.format}
                              onChange={(e) => mut((c) => { c[di].blocks[bi].format = e.target.value; })}>
                              {!FORMATS.includes(b.format) && <option value={b.format}>{b.format}</option>}
                              {FORMATS.map((f) => <option key={f} value={f}>{f.split('_').join(' ')}</option>)}
                            </select>
                          </label>
                          <label className="editlabel half">Nombre
                            <input className="loginput" value={b.name ?? ''}
                              onChange={(e) => mut((c) => { c[di].blocks[bi].name = e.target.value; })} />
                          </label>
                        </div>
                        <label className="editlabel">Esquema (series, tiempo...)
                          <input className="loginput" value={b.scheme ?? ''}
                            onChange={(e) => mut((c) => { c[di].blocks[bi].scheme = e.target.value; })} />
                        </label>
                        <label className="editlabel">Lineas: una por renglon. Niveles con | (ej: RX: 5x5 @ 70% | ELITE: 5x5 @ 75%). Las adaptaciones por molestia se detectan solas
                          <textarea className="loginput" rows={Math.max(3, (b.lines ?? []).length + 1)}
                            defaultValue={linesToText(b)}
                            onBlur={(e) => mut((c) => { c[di].blocks[bi].lines = textToLines(e.target.value, c[di].blocks[bi].lines); })} />
                        </label>
                        {(b.lines ?? []).some((l: any) => l.patterns && l.patterns.length > 0) && (
                          <p className="note" style={{ marginTop: 4 }}>
                            Se adaptara por molestias:{' '}
                            {(b.lines ?? [])
                              .map((l: any, i: number) => (l.patterns && l.patterns.length ? 'linea ' + (i + 1) : null))
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                        <label className="editlabel">Nota del bloque
                          <input className="loginput" value={b.note ?? ''}
                            onChange={(e) => mut((c) => { c[di].blocks[bi].note = e.target.value; })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          {bi > 0 && (
                            <button className="chip" onClick={() => mut((c) => {
                              const arr = c[di].blocks;
                              [arr[bi - 1], arr[bi]] = [arr[bi], arr[bi - 1]];
                            })}>Subir</button>
                          )}
                          {bi < d.blocks.length - 1 && (
                            <button className="chip" onClick={() => mut((c) => {
                              const arr = c[di].blocks;
                              [arr[bi], arr[bi + 1]] = [arr[bi + 1], arr[bi]];
                            })}>Bajar</button>
                          )}
                          <button className="chip danger" onClick={() => {
                            if (confirm('Eliminar este bloque?')) mut((c) => { c[di].blocks.splice(bi, 1); });
                          }}>Eliminar bloque</button>
                        </div>
                      </div>
                    ))}

                    <button className="chip" style={{ marginTop: 10 }} onClick={() => mut((c) => {
                      c[di].blocks.push({
                        id: 'nb-' + Date.now(),
                        tag: 'COMPLEMENTARIO',
                        format: 'TRABAJO',
                        name: '',
                        scheme: '',
                        note: '',
                        logType: null,
                        lines: [{ id: 'l1', content: { '*': 'Nueva linea' }, patterns: [] }],
                      });
                    })}>+ Anadir bloque</button>
                  </div>
                )}
              </div>
            ))}

            {valErr && <p className="formerror">{valErr}</p>}
            {pubMsg && <p className="forminfo">{pubMsg}</p>}
            <button className="cta" style={{ marginTop: 14 }} disabled={pubBusy === tk} onClick={publishDays}>
              {pubBusy === tk ? 'Publicando...' : 'Publicar esta semana'}
            </button>
            <p className="note center">Los cambios no afectan a nadie hasta que pulses Publicar.</p>
          </>
        )}
      </main>
    );
  }

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

      <p className="eyebrow" style={{ marginTop: 18 }}>Programacion</p>
      {(['CF', 'HX'] as const).map((tk) => (
        <div key={tk} className="option" style={{ cursor: 'default' }}>
          <strong>{tk === 'CF' ? 'CrossFit' : 'HYROX'}</strong>
          <span>
            {(() => {
              const thisMonday = mondayOf(new Date());
              const n = Array.from({ length: 8 }, (_, i) => isoDate(addDays(thisMonday, i * 7))).filter((ws) => pub[tk + '|' + ws]).length;
              return n === 0 ? 'Ninguna de las proximas 8 semanas programada' : n + ' de las proximas 8 semanas programadas';
            })()}
          </span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="chip" onClick={() => openEditor(tk)}>Abrir planificador</button>
          </div>
        </div>
      ))}
      {pubMsg && <p className="forminfo">{pubMsg}</p>}

      <p className="eyebrow" style={{ marginTop: 22 }}>Atletas</p>
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
