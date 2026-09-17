# 🚀 WorkIn — Plataforma Freelance con Escrow Simulado

Monorepo completo para la plataforma freelance **WorkIn**, desarrollado con arquitectura modular (Turborepo, Vite, React, TypeScript, Tailwind CSS) y backend local en **Supabase** (PostgreSQL, Row Level Security, Triggers atómicos, Realtime y autenticación).

---

## 📋 Requisitos Previos en Fedora Linux (KDE Plasma)

Para ejecutar este proyecto en **Fedora Linux**, asegúrate de tener instaladas las siguientes herramientas en tu sistema.

Abre la terminal (**Konsole**) y ejecuta los siguientes pasos:

### 1. Actualizar el sistema e instalar herramientas básicas
```bash
sudo dnf update -y
sudo dnf install -y git curl wget
```

### 2. Instalar y configurar Docker (imprescindible para Supabase)
Supabase local corre a través de contenedores Docker:

```bash
# Instalar Docker y Docker Compose
sudo dnf install -y docker docker-compose-plugin

# Iniciar el servicio y habilitarlo al arranque
sudo systemctl enable --now docker

# Agregar tu usuario al grupo docker (para no requerir sudo)
sudo usermod -aG docker $USER
```
> [!IMPORTANT]
> Tras ejecutar `usermod`, **cierra sesión en KDE Plasma y vuelve a iniciar sesión** (o reinicia la computadora) para que los permisos de grupo surtan efecto. Puedes verificar que funciona ejecutando: `docker ps`.

### 3. Instalar Node.js y pnpm
Se recomienda Node.js 20 o superior:

```bash
# Instalar Node.js LTS
sudo dnf install -y nodejs

# Instalar pnpm globalmente
sudo npm install -g pnpm
```

### 4. Instalar Supabase CLI
Instala la CLI oficial de Supabase para gestionar la base de datos y migraciones locales:

```bash
sudo npm install -g supabase
```

---

## 🛠️ Guía de Instalación y Puesta en Marcha

Una vez configurado Fedora con los requisitos anteriores:

### 1. Clonar el repositorio
```bash
git clone <URL_DE_TU_REPOSITORIO_GIT>
cd workin-web
```

### 2. Instalar dependencias del monorepo
```bash
pnpm install
```

### 3. Configurar variables de entorno
Copia la plantilla o asegúrate de que exista el archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Verifica que el archivo `.env` contenga las credenciales del entorno local de Supabase:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### 4. Iniciar Supabase Local
Asegúrate de que Docker esté corriendo y levanta todos los servicios de base de datos y autenticación:

```bash
supabase start
```
*Este comando descargará las imágenes oficiales (Postgres 17, Kong, Gotrue, Realtime, Studio, Mailpit) y aplicará automáticamente todas las migraciones SQL que se encuentran en `supabase/migrations/`.*

### 5. Iniciar la aplicación web en desarrollo
```bash
pnpm dev
```

La aplicación estará lista y accesible en tu navegador:
👉 **`http://localhost:5173`**

---

## 🌐 Servicios y Puertos Locales

Cuando el entorno está corriendo, tienes acceso a los siguientes paneles y servicios en tu computadora:

| Servicio | URL Local | Descripción |
|---|---|---|
| **Frontend Web** | `http://localhost:5173` | Aplicación principal WorkIn |
| **Supabase Studio** | `http://localhost:54323` | Dashboard visual de Postgres, tablas, SQL editor |
| **Supabase API (Kong)** | `http://127.0.0.1:54321` | Endpoint REST y autenticación |
| **PostgreSQL DB** | `localhost:54322` | Base de datos (`user: postgres`, `pass: postgres`) |
| **Bandeja de Emails (Mailpit)** | `http://127.0.0.1:54324` | Captura de correos transaccionales locales |

---

## 🧪 Pruebas Automatizadas y Verificación

El proyecto cuenta con suites de validación completas para asegurar la estabilidad del sistema:

### 1. Pruebas de Seguridad RLS (Row Level Security)
Verifica que ningún usuario pueda leer, editar ni inyectar datos en órdenes, pagos ni chats ajenos (45 aserciones):
```bash
docker exec -i supabase_db_workin-web psql -U postgres -d postgres < supabase/tests/rls_audit_test.sql
```

### 2. Pruebas de Resistencia Escrow y Mediación
Verifica prevención de dobles pagos, dobles liberaciones de fondos, divisiones porcentuales y veredictos (25 aserciones):
```bash
docker exec -i supabase_db_workin-web psql -U postgres -d postgres < supabase/tests/escrow_stress_test.sql
```

### 3. Chequeo de Compilación y Linter
```bash
pnpm build
pnpm lint
```

---

## 📁 Estructura del Proyecto (Monorepo)

```
workin-web/
├── apps/
│   └── web/                 # Aplicación React + Vite + Tailwind CSS
│       └── src/
│           ├── features/    # Módulos por función (admin, auth, orders, payments, messaging, etc.)
│           ├── hooks/       # Custom hooks reactivos (useAuth, useNotifications, useChat)
│           └── shared/      # ErrorBoundary, Guards de acceso (RoleGuard, SupportGuard)
├── packages/
│   ├── core/                # Reglas de negocio puras (cálculo de comisiones, escrow, splits)
│   ├── api/                 # Capa de queries y mutations tipadas con Supabase
│   ├── types/               # Tipos de TypeScript del dominio y tipos generados de DB
│   └── ui/                  # Componentes de diseño compartidos (Button, Card, Badge, Modal)
├── supabase/
│   ├── migrations/          # 11 migraciones SQL versionadas (tablas, RLS, triggers)
│   ├── tests/               # Scripts SQL de auditoría RLS y estrés de escrow
│   └── config.toml          # Configuración del entorno local de Supabase
└── docs/
    └── schema-erd.md        # Diagrama ERD y modelos en Dart para Flutter
```

---

## 🛑 Comandos de Detención y Mantenimiento

* **Pausar Supabase:** `supabase stop` (guarda el estado de la base de datos).
* **Resetear base de datos desde cero:** `supabase db reset` (vuelve a correr todas las migraciones limpias).
* **Ver estado de contenedores:** `docker ps` o `supabase status`.
