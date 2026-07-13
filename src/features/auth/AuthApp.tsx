import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Track } from '../../core';
import { LEVELS } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { TodaySession } from '../today/TodaySession';

interface Profile {
  id: string;
  display_name: string;
  track: Track;
  level: string | null;
}

const TRACK_INFO: Record<Track, { name: string; desc: string }> = {
  CF: { name: 'CrossFit', desc: 'Fuerza, halterofilia, gimnásticos y WODs con periodización explicada. Niveles: Escalado, Intermedio, RX y Élite.' },
  HX: { name: 'HYROX', desc: 'Carrera comprometida, trineos, estaciones y simulaciones race pace. Divisiones: Open (individual) y Pro.' },
};

/* ---------------- Pantalla de acceso ---------------- */
function AuthScreen() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (mode === 'signup' && name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!email.includes('@')) return setError('Ese email no parece válido.');
    if (password.length < 6) return setError('La contraseña necesita al menos 6 caracteres.');
    setBusy(true);
    const sb = supabase!;
    const { error: err } =
      mode === 'signup'
        ? await sb.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } })
        : await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : err.message);
  };

  return (
    <main className="screen onboard">
      <p className="eyebrow">{mode === 'signup' ? 'Bienvenido' : 'Hola de nuevo'}</p>
      <h1 className="brand">KAIROS</h1>
      <p className="muted" style={{ fontSize: 16 }}>
        La única programación que se adapta a tu día, no al revés.
      </p>
      {mode === 'signup' && (
        <input className="loginput big" placeholder="Tu nombre" value={name}
          onChange={(e) => setName(e.target.value)} autoComplete="name" />
      )}
      <input className="loginput big" type="email" placeholder="Tu email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className="loginput big" type="password"
        placeholder={mode === 'signup' ? 'Crea una contraseña (mín. 6)' : 'Tu contraseña'}
        value={password} onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
      {error && <p className="formerror">{error}</p>}
      <button className="cta" disabled={busy} onClick={submit}>
        {busy ? 'Un momento…' : mode === 'signup' ? 'Crear mi cuenta' : 'Entrar'}
      </button>
      {mode === 'signup' && (
        <p className="note" style={{ textAlign: 'center', marginTop: 12 }}>
          7 días gratis · después 14,99 €/mes · cancela cuando quieras
        </p>
      )}
      <button className="link" style={{ textAlign: 'center', width: '100%' }}
        onClick={() => { setError(''); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>
        {mode === 'signup' ? '¿Ya tienes cuenta? Entra aquí' : '¿Aún sin cuenta? Regístrate'}
      </button>
    </main>
  );
}

/* ---------------- Elección de programación (una vez) ---------------- */
function TrackChoice({ onChoose, busy }: { onChoose: (t: Track) => void; busy: boolean }) {
  return (
    <main className="screen">
      <p className="eyebrow">Último paso</p>
      <h1>Elige tu programación</h1>
      <p className="muted">
        Tu elección se mantiene el mes completo: un bloque de entrenamiento necesita
        continuidad para funcionar.
      </p>
      {(Object.keys(TRACK_INFO) as Track[]).map((tk) => (
        <button key={tk} className="option" disabled={busy} onClick={() => onChoose(tk)}>
          <strong>{TRACK_INFO[tk].name}</strong>
          <span>{TRACK_INFO[tk].desc}</span>
        </button>
      ))}
    </main>
  );
}

/* ---------------- App autenticada ---------------- */
export function AuthApp() {
  const sb = supabase!;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
  }, [session]);

  const chooseTrack = async (track: Track) => {
    if (!session) return;
    setBusy(true);
    const display_name = (session.user.user_metadata?.display_name as string) ?? 'Atleta';
    const { data, error } = await sb.from('profiles')
      .insert({ id: session.user.id, display_name, track, level: null })
      .select().single();
    setBusy(false);
    if (!error && data) setProfile(data as Profile);
  };

  const setLevel = async (level: string) => {
    if (!profile) return;
    setProfile({ ...profile, level });
    await sb.from('profiles').update({ level }).eq('id', profile.id);
  };

  if (loading) return <main className="screen"><p className="muted">Cargando…</p></main>;
  if (!session) return <AuthScreen />;
  if (!profile) return <TrackChoice onChoose={chooseTrack} busy={busy} />;

  const track = profile.track;
  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">KAIROS</span>
        <div className="switchers">
          <span className="chip on">{track === 'CF' ? 'CrossFit' : 'HYROX'}</span>
          <button className="chip" onClick={() => sb.auth.signOut()}>
            {profile.display_name.split(' ')[0]} · Salir
          </button>
        </div>
      </header>
      <TodaySession key={track} track={track} level={profile.level}
        levels={LEVELS[track]} onLevelChange={setLevel} />
    </div>
  );
}
