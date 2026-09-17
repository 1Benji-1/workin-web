# Plataforma Freelance — Monorepo

Ver `fases-proyecto-freelance-web.md` para el detalle completo de fases.

## Estructura

```
apps/
  web/                 → React + Vite + Tailwind (única app por ahora)
packages/
  core/                → lógica de negocio pura (reglas de escrow, comisiones, validaciones)
  api/                 → capa de acceso a Supabase (queries/mutations)
  types/                → tipos de dominio + tipos generados de Supabase
  ui/                   → componentes visuales reutilizables
supabase/              → CLI config.toml, migrations/, functions/
docs/                  → Documentación técnica y contratos compartidos (ERD para Flutter)
```

## Documentación de Base de Datos y Modelos
Ver [`docs/schema-erd.md`](docs/schema-erd.md) para el diagrama ERD completo, tipos y modelos Dart listos para la app Flutter.

## Setup inicial (una sola vez)

```bash
pnpm install
cp .env.example .env
# completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
```

## Desarrollo

```bash
pnpm dev
```

## Convenciones

- Nada de lógica de negocio dentro de `apps/web` — solo UI y routing. Todo lo demás vive en `packages/core` y `packages/api`.
- Las migraciones de Supabase se escriben en `supabase/migrations/`, nunca se editan tablas a mano desde el dashboard.
- Cada feature de `apps/web/src/features/<nombre>` corresponde a una fase del documento de fases.
