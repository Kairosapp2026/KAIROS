import { useState } from 'react';
import type { Track } from './core';
import { LEVELS } from './data/mockData';
import { isDemo } from './lib/supabase';
import { TodaySession } from './features/today/TodaySession';

const storedLevel = (tk: Track) => localStorage.getItem('kairos-level-' + tk);

export default function App() {
  // En produccion, el track viene del perfil (onboarding). El nivel lo elige
  // el atleta al empezar cada sesion y se recuerda como "nivel habitual".
  const [track, setTrackState] = useState<Track>(
    () => (localStorage.getItem('kairos-track') as Track) || 'CF',
  );
  const [level, setLevelState] = useState<string | null>(() => storedLevel(track));

  const setTrack = (tk: Track) => {
    setTrackState(tk);
    localStorage.setItem('kairos-track', tk);
    setLevelState(storedLevel(tk)); // cada track recuerda su propio nivel
  };
  const setLevel = (l: string) => {
    setLevelState(l);
    localStorage.setItem('kairos-level-' + track, l);
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">KAIROS</span>
        <div className="switchers">
          {(['CF', 'HX'] as Track[]).map((tk) => (
            <button key={tk} className={`chip ${track === tk ? 'on' : ''}`} onClick={() => setTrack(tk)}>
              {tk === 'CF' ? 'CrossFit' : 'HYROX'}
            </button>
          ))}
        </div>
      </header>
      {isDemo && <div className="demobar">Modo demo con datos locales · conecta Supabase en el Paso 2 del README</div>}
      <TodaySession key={track} track={track} level={level} levels={LEVELS[track]} onLevelChange={setLevel} />
    </div>
  );
}
