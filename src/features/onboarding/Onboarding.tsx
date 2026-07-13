import { useState } from 'react';
import type { Track } from '../../core';

export interface Account {
  name: string;
  email: string;
  track: Track;
  createdAt: string;
}

const TRACK_INFO: Record<Track, { name: string; desc: string }> = {
  CF: {
    name: 'CrossFit',
    desc: 'Fuerza, halterofilia, gimnasticos y WODs con periodizacion explicada. Niveles: Escalado, Intermedio, RX y Elite.',
  },
  HX: {
    name: 'HYROX',
    desc: 'Carrera comprometida, trineos, estaciones y simulaciones race pace. Divisiones: Open (individual) y Pro.',
  },
};

type Step = 'welcome' | 'form' | 'track';

export function Onboarding({ onDone }: { onDone: (a: Account) => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (step === 'welcome')
    return (
      <main className="screen onboard">
        <p className="eyebrow">Bienvenido</p>
        <h1 className="brand">KAIROS</h1>
        <p className="muted" style={{ fontSize: 16 }}>
          La unica programacion que se adapta a tu dia, no al reves.
        </p>
        <button className="cta" onClick={() => setStep('form')}>Crear mi cuenta</button>
        <p className="note" style={{ textAlign: 'center', marginTop: 12 }}>
          7 dias gratis - despues 14,99 EUR/mes - cancela cuando quieras
        </p>
      </main>
    );

  if (step === 'form')
    return (
      <main className="screen">
        <p className="eyebrow">Registro - paso 1 de 2</p>
        <h1>Crea tu cuenta</h1>
        <p className="muted">Tus sesiones, marcas y adaptaciones quedaran ligadas a esta cuenta.</p>
        <input className="loginput big" placeholder="Tu nombre" value={name}
          onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <input className="loginput big" type="email" placeholder="Tu email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {error && <p className="formerror">{error}</p>}
        <button className="cta" onClick={() => {
          if (name.trim().length < 2) return setError('Escribe tu nombre.');
          if (!email.includes('@') || !email.includes('.')) return setError('Ese email no parece valido.');
          setError('');
          setStep('track');
        }}>
          Continuar
        </button>
        <button className="link" onClick={() => setStep('welcome')}>Volver</button>
      </main>
    );

  return (
    <main className="screen">
      <p className="eyebrow">Registro - paso 2 de 2</p>
      <h1>Elige tu programacion</h1>
      <p className="muted">
        Tu eleccion se mantiene el mes completo: un bloque de entrenamiento necesita
        continuidad para funcionar.
      </p>
      {(Object.keys(TRACK_INFO) as Track[]).map((tk) => (
        <button key={tk} className="option"
          onClick={() => onDone({ name: name.trim(), email: email.trim().toLowerCase(), track: tk, createdAt: new Date().toISOString() })}>
          <strong>{TRACK_INFO[tk].name}</strong>
          <span>{TRACK_INFO[tk].desc}</span>
        </button>
      ))}
      <button className="link" onClick={() => setStep('form')}>Volver</button>
    </main>
  );
}
