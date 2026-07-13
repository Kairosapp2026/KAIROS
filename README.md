# KAIROS

La única programación que se adapta a tu día, no al revés.

## Paso 1 — Arrancar en local (5 minutos, hoy)

Requisitos: Node.js 18+ (nodejs.org).

```bash
npm install
npm run dev
```

Abre http://localhost:5173. La app funciona en **modo demo** con una semana
completa de CrossFit y otra de HYROX cargadas en `src/data/mockData.ts`.
Prueba el flujo entero: elegir 1h/2h, marcar una molestia (por ejemplo
"hombro · en carga" un martes) y ver la sesión adaptada con la movilidad final.

## Paso 2 — Conectar Supabase (1 tarde)

1. Crea un proyecto gratis en supabase.com.
2. En SQL Editor, pega y ejecuta `supabase/migration.sql`.
3. Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (Settings → API).
4. Sustituye la carga de datos en `src/features/today/useTodaySession.ts`
   por la query de Supabase (está marcada con TODO y documentada en
   `kairos-arquitectura.md`).

## Paso 3 — Publicar (30 minutos)

1. Sube el proyecto a GitHub.
2. En vercel.com: Import Project → añade las dos variables de entorno → Deploy.
3. Tienes URL pública. Cada `git push` despliega solo.

## Paso 4 — Pagos (cuando el flujo esté validado con betas)

Stripe Billing: producto "Kairos mensual" a 14,99 € con `trial_period_days: 7`.
El webhook y el cambio de programación diferido están especificados en el
documento de arquitectura.

## Estructura

```
src/core/       Motor de adaptación (lógica pura, sin React) — el producto
src/data/       Semana demo CF + HX y reglas de sustitución
src/features/   Vistas (today = flujo principal)
src/lib/        Cliente Supabase con modo demo automático
supabase/       Migración SQL completa con RLS
```
