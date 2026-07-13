import { isDemo } from './lib/supabase';
import { AuthApp } from './features/auth/AuthApp';

export default function App() {
  if (isDemo) return <p style={{ color: 'white', padding: 20 }}>Faltan las variables de Supabase (.env)</p>;
  return <AuthApp />;
}
