// Cliente de Supabase con modo demo:
// si no hay variables de entorno, la app funciona con los datos locales.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isDemo = !url || !key;
export const supabase: SupabaseClient | null = isDemo ? null : createClient(url!, key!);
