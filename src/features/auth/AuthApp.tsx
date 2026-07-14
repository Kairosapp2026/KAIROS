import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Track } from '../../core';
import { LEVELS } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { TodaySession } from '../today/TodaySession';
import { CoachPanel } from '../coach/CoachPanel';
import { Landing } from '../landing/Landing';

interface Profile {
  id: string;
  display_name: string;
  track: Track;
  level: string | null;
  role: string | null;
}

const TRACK_INFO: Record<Track, { name: string; desc: string }> = {
  CF: { name: 'CrossFit', desc: 'Fuerza, halterofilia, gimnasticos y WODs con periodizacion explicada. Niveles: Escalado, Intermedio, RX y Elite.' },
  HX: { name: 'HYROX', desc: 'Carrera comprometida, trineos, estaciones y simulaciones race pace. Divisiones: Open (individual) y Pro.' },
};

type AuthMode = 'signup' | 'signin' | 'reset';

function AuthScreen({ initialMode, onBack }: { initialMode: AuthMode; onBack: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(''); setInfo('');
    const sb = supabase!;

    if (mode === 'reset') {
      if (!email.includes('@')) return setError('Escribe el email de tu cuenta.');
      setBusy(true);
      const { error: err } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setBusy(false);
      if (err) setError(err.message);
      else setInfo('Hecho. Revisa tu correo (tambien spam) y abre el enlace para crear una contrasena nueva.');
      return;
    }

    if (mode === 'signup' && name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!email.includes('@')) return setError('Ese email no parece valido.');
    if (password.length < 6) return setError('La contrasena necesita al menos 6 caracteres.');
    setBusy(true);
    const { error: err } =
      mode === 'signup'
        ? await sb.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } })
        : await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email o contrasena incorrectos.' : err.message);
  };

  return (
    <main className="screen onboard">
      <p className="eyebrow">
        {mode === 'signup' ? 'Bienvenido' : mode === 'signin' ? 'Hola de nuevo' : 'Recuperar acceso'}
      </p>
      <h1 className="brand">KAIROS</h1>
      {mode === 'reset' ? (
        <p className="muted" style={{ fontSize: 15 }}>
          Dinos tu email y te enviamos un enlace para crear una contrasena nueva.
        </p>
      ) : (
        <p className="muted" style={{ fontSize: 16 }}>
          La unica programacion que se adapta a tu dia, no al reves.
        </p>
      )}

      {mode === 'signup' && (
        <input className="loginput big" placeholder="Tu nombre" value={name}
          onChange={(e) => setName(e.target.value)} autoComplete="name" />
      )}
      <input className="loginput big" type="email" placeholder="Tu email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      {mode !== 'reset' && (
        <input className="loginput big" type="password"
          placeholder={mode === 'signup' ? 'Crea una contrasena (min. 6)' : 'Tu contrasena'}
          value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
      )}

      {error && <p className="formerror">{error}</p>}
      {info && <p className="forminfo">{info}</p>}

      <button className="cta" disabled={busy} onClick={submit}>
        {busy ? 'Un momento...'
          : mode === 'signup' ? 'Crear mi cuenta'
          : mode === 'signin' ? 'Entrar'
          : 'Enviarme el enlace'}
      </button>

      {mode === 'signup' && (
        <p className="note" style={{ textAlign: 'center', marginTop: 12 }}>
          7 dias gratis - despues 14,99 EUR/mes - cancela cuando quieras
        </p>
      )}

      {mode === 'signin' && (
        <button className="link" style={{ textAlign: 'center', width: '100%' }}
          onClick={() => { setError(''); setInfo(''); setMode('reset'); }}>
          Olvide mi contrasena
        </button>
      )}
      <button className="link" style={{ textAlign: 'center', width: '100%' }}
        onClick={() => { setError(''); setInfo(''); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>
        {mode === 'signup' ? 'Ya tienes cuenta? Entra aqui' : 'Aun sin cuenta? Registrate'}
      </button>
      <button className="link" style={{ textAlign: 'center', width: '100%' }} onClick={onBack}>
        Volver
      </button>
    </main>
  );
}

function NewPasswordScreen({ onDone }: { onDone: () => void }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (p1.length < 6) return setError('Minimo 6 caracteres.');
    if (p1 !== p2) return setError('Las contrasenas no coinciden.');
    setBusy(true);
    const { error: err } = await supabase!.auth.updateUser({ password: p1 });
    setBusy(false);
    if (err) setError(err.message);
    else onDone();
  };

  return (
    <main className="screen onboard">
      <p className="eyebrow">Nueva contrasena</p>
      <h1 className="brand">KAIROS</h1>
      <p className="muted" style={{ fontSize: 15 }}>Crea tu nueva contrasena y seguimos entrenando.</p>
      <input className="loginput big" type="password" placeholder="Nueva contrasena (min. 6)"
        value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" />
      <input className="loginput big" type="password" placeholder="Repitela"
        value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />
      {error && <p className="formerror">{error}</p>}
      <button className="cta" disabled={busy} onClick={submit}>
        {busy ? 'Guardando...' : 'Guardar y entrar'}
      </button>
    </main>
  );
}

function TrackChoice({ onChoose, busy }: { onChoose: (t: Track) => void; busy: boolean }) {
  return (
    <main className="screen">
      <p className="eyebrow">Ultimo paso</p>
      <h1>Elige tu programacion</h1>
      <p className="muted">
        Tu eleccion se mantiene el mes completo: un bloque de entrenamiento necesita
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

export function AuthApp() {
  const sb = supabase!;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [coachView, setCoachView] = useState<'panel' | 'atleta'>('panel');
  const [gate, setGate] = useState<'landing' | 'signup' | 'signin'>('landing');
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
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

  if (loading) return <main className="screen"><p className="muted">Cargando...</p></main>;

  if (recovery && session) return <NewPasswordScreen onDone={() => setRecovery(false)} />;

  if (!session) {
    if (gate === 'landing')
      return <Landing onStart={() => setGate('signup')} onLogin={() => setGate('signin')} />;
    return <AuthScreen initialMode={gate} onBack={() => setGate('landing')} />;
  }

  if (!profile) return <TrackChoice onChoose={chooseTrack} busy={busy} />;

  const isCoach = profile.role === 'coach';
  const track = profile.track;

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo logobtn" onClick={() => window.location.assign('/')}>KAIROS</button>
        <div className="switchers">
          {isCoach && (
            <button className={`chip ${coachView === 'panel' ? 'on' : ''}`}
              onClick={() => setCoachView(coachView === 'panel' ? 'atleta' : 'panel')}>
              {coachView === 'panel' ? 'Ver como atleta' : 'Panel de coach'}
            </button>
          )}
          {(!isCoach || coachView === 'atleta') && (
            <span className="chip on">{track === 'HX' ? 'HYROX' : 'CrossFit'}</span>
          )}
          <button className="chip" onClick={() => sb.auth.signOut()}>
            {profile.display_name.split(' ')[0]} - Salir
          </button>
        </div>
      </header>
      {isCoach && coachView === 'panel'
        ? <CoachPanel />
        : <TodaySession key={track} track={track} level={profile.level}
            levels={LEVELS[track]} onLevelChange={setLevel} />}
    </div>
  );
}
