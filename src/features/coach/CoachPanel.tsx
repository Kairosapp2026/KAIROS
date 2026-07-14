import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Athlete {
  id: string;
  display_name: string;
  track: string;
  level: string | null;
  role: string | null;
  created_at: string;
}

export function CoachPanel() {
  const sb = supabase!;
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    sb.from('profiles')
      .select('id, display_name, track, level, role, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setAthletes((data as Athlete[]) ?? []);
      });
  }, []);

  if (error)
    return <main className="screen"><p className="formerror">Error cargando atletas: {error}</p></main>;
  if (!athletes)
    return <main className="screen"><p className="muted">Cargando atletas...</p></main>;

  const soloYo = athletes.length <= 1;

  return (
    <main className="screen">
      <p className="eyebrow">Panel de coach</p>
      <h1>Tus atletas</h1>
      <p className="muted">
        {athletes.length} {athletes.length === 1 ? 'perfil registrado' : 'perfiles registrados'}.
        Aqui veras a cada atleta con su programacion y nivel.
      </p>

      {soloYo && (
        <p className="notice">
          De momento solo apareces tu. Si ya hay mas atletas registrados y no salen,
          faltan los permisos de coach en Supabase: te los paso cuando quieras.
        </p>
      )}

      {athletes.map((a) => (
        <div key={a.id} className="option" style={{ cursor: 'default' }}>
          <strong>
            {a.display_name}
            {a.role === 'coach' && <em className="badge ok" style={{ marginLeft: 8 }}>COACH</em>}
          </strong>
          <span>
            {a.track === 'HX' ? 'HYROX' : 'CrossFit'}
            {a.level ? ' - ' + a.level : ' - sin nivel elegido aun'}
            {' - alta: ' + new Date(a.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>
      ))}

      <p className="note" style={{ marginTop: 14 }}>
        Proximamente en este panel: editor de semanas, marcas y comentarios de cada atleta,
        y alertas de molestias repetidas.
      </p>
    </main>
  );
}
