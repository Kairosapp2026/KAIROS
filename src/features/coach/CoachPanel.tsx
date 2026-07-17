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
const DAY_FULL = ['', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const VALID_TAGS = ['NUCLEO', 'COMPLEMENTARIO', 'EXTRA'];

function linesToText(b: any): string {
  return (b.lines ?? []).map((l: any) =>
    l.text + (l.patterns && l.patterns.length ? ' :: ' + l.patterns.join(', ') : '')
  ).join('\n');
}

function textToLines(v: string): any[] {
  return v.split('\n').map((raw) => raw.trim()).filter((raw) => raw.length > 0).map((raw) => {
    const idx = raw.indexOf('::');
    if (idx === -1) return { text: raw };
    const text = raw.slice(0, idx).trim();
    const patterns = raw.slice(idx + 2).split(',').map((p) => p.trim()).filter((p) => p);
    return patterns.length ? { text, patterns } : { text: raw };
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
        if (typeof l.text !== 'string' || !l.text) return { error: 'Hay una linea sin "text" en ' + DAY_FULL[d.dow] + '.' };
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
    sb.from('published_weeks').select('track, updated_at').then(({ data }) => {
      const map: Record<string, string> = {};
      for (const r of (data ?? []) as { track: string; updated_at: string }[]) map[r.track] = r.updated_at;
      setPub(map);
    });
  };
  useEffect(loadPub, []);

  const [progTrack, setProgTrack] = useState<'CF' | 'HX' | null>(null);
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
    setValErr('');
    setPubMsg('');
    setEditMode('visual');
    setOpenDay(null);
    sb.from('published_weeks').select('data').eq('track', tk).maybeSingle()
      .then(({ data }) => {
        const d = (data && data.data) ? data.data : WEEKS[tk];
        setDays(JSON.parse(JSON.stringify(d)));
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
      data: res.days,
      updated_at: new Date().toISOString(),
    });
    setPubBusy(null);
    if (err) setPubMsg('Error al publicar: ' + err.message);
    else { setPubMsg('Semana publicada. Tus atletas ya la ven.'); loadPub(); }
  };

  const publish = async (tk: 'CF' | 'HX') => {
    setPubBusy(tk);
    setPubMsg('');
    const { error: err } = await sb.from('published_weeks').upsert({
      track: tk,
      data: WEEKS[tk],
      updated_at: new Date().toISOString(),
    });
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

  /* ---------- Editor de programacion ---------- */
  if (progTrack) {
    const tk = progTrack;
    return (
      <main className="screen">
        <button className="link" onClick={() => { setProgTrack(null); setDays(null); setValErr(''); setPubMsg(''); }}>
          Volver al panel
        </button>
        <h1 style={{ marginTop: 8 }}>Programacion {tk === 'CF' ? 'CrossFit' : 'HYROX'}</h1>
        <p className="muted">
          {pub[tk]
            ? 'Ultima publicacion: ' + new Date(pub[tk]).toLocaleDateString('es-ES') + ' a las ' + new Date(pub[tk]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : 'Sin publicar: tus atletas ven la semana del codigo.'}
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
                            <input className="loginput" value={b.format}
                              onChange={(e) => mut((c) => { c[di].blocks[bi].format = e.target.value; })} />
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
                        <label className="editlabel">Lineas (una por renglon; adaptable: texto :: patron)
                          <textarea className="loginput" rows={Math.max(3, (b.lines ?? []).length + 1)}
                            defaultValue={linesToText(b)}
                            onBlur={(e) => mut((c) => { c[di].blocks[bi].lines = textToLines(e.target.value); })} />
                        </label>
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
                        lines: [{ text: 'Nueva linea' }],
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
            {pub[tk]
              ? 'Publicada el ' + new Date(pub[tk]).toLocaleDateString('es-ES') + ' a las ' + new Date(pub[tk]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : 'Sin publicar - los atletas ven la semana del codigo'}
          </span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="chip" onClick={() => openEditor(tk)}>Editar y publicar</button>
            <button className="chip" disabled={pubBusy === tk} onClick={() => publish(tk)}>
              {pubBusy === tk ? 'Publicando...' : 'Publicar la del codigo'}
            </button>
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
