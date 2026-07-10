# HenryLeads (leads-portal) — Migración a stack propio

## Qué es esto
CRM de WhatsApp para talleres/refaccionarias. Primer cliente activo: **Cremalleras LR** (Guadalajara). Prototipo funcional en HTML/JS vanilla + Supabase, con plan de migrar a: **TypeScript, React, Next.js, Tailwind + shadcn/ui, Prisma, PostgreSQL, desplegado en Railway**.

Repo: https://github.com/efigueroaesqueda-cell/leads-portal
Live: https://efigueroaesqueda-cell.github.io/leads-portal/

## ⚠️ Antes de tocar el schema: coordinar con el proyecto "Henry's" de Ricardo
Ricardo está construyendo un sistema propio para Henry's Diagnostics con el mismo stack (Next.js/Prisma/Postgres/Railway). No es coincidencia: **HenryLeads y el portal de flotilla de GAGA (`../gaga-cotizador`) ya comparten hoy el mismo proyecto de Supabase** (`bgpugtgjbfseqwwcwpyd`, prefijos `lp_` para HenryLeads).

Antes de diseñar `schema.prisma` en aislamiento, confirmar con Ricardo:
1. ¿Ya tiene repo/schema de Prisma para "Henry's"? Si sí, HenryLeads debe encajar en su modelo de `Empresa`/tenant, no crear uno paralelo.
2. ¿GAGA y HenryLeads viven en el mismo proyecto Railway/DB, o como servicios separados vía API?
3. Confirmar si "el prototipo" que Ricardo mencionó integrar es GAGA, HenryLeads, o ambos (Enrique cree que ambos).

Si no hay respuesta de Ricardo todavía, diseñar el schema de forma modular (namespace propio) para fusionar después sin fricción.

## Qué existe hoy (prototipo)
- **Frontend:** `index.html` (bandeja de chat), `pipeline.html` (kanban), `leads.html` (tabla CRM), `config.html` (ajustes) — HTML/CSS/JS vanilla.
- **Backend:** Supabase (Postgres + PostgREST + Edge Functions + Realtime), acceso vía anon key directo desde el navegador (sin backend propio).
- **Webhook WhatsApp:** Supabase Edge Function (Deno) `whatsapp-webhook.js` — recibe mensajes de Meta Cloud API (GET verificación, POST mensajes), guarda en `lp_mensajes`/`lp_leads`. **Solo recibe, no envía** — falta construir el envío de respuestas.
- **Multi-tenant:** `empresa_id` en todas las tablas desde el diseño original, pensando en escalar a Henry's Diagnostics y La Refa Automotriz.

## Schema actual (ver `supabase-schema.sql` en el repo)
Tablas: `lp_empresas`, `lp_asesores`, `lp_etapas`, `lp_etiquetas`, `lp_leads`, `lp_lead_etiquetas` (many-to-many), `lp_mensajes`, `lp_mensajes_rapidos`, `lp_automatizaciones` (jsonb para trigger/acción), `lp_cotizaciones`.

Puntos a resolver al pasar a Prisma:
- **`lp_empresas.wa_access_token` (texto plano) es un riesgo de seguridad real**: RLS desactivado + GRANT ALL a `anon` = el token es leíble públicamente. En el nuevo sistema debe ir como env var/secret server-side, nunca en una tabla de negocio.
- `lp_automatizaciones` usa jsonb genérico — decidir si tipar más explícito o validar con Zod.
- No hay tabla de auth real (`lp_asesores` es solo directorio) — falta modelo de autenticación/sesiones.
- No hay aislamiento real por `empresa_id` — hoy es solo convención de cliente, no regla de seguridad server-side.

## Estado de la conexión Meta WhatsApp (al 2026-07-01)
- Webhook configurado y funcionando (URL de Supabase, verify token, suscrito a `messages`). Tuvo un bug de JWT-por-default de Supabase, resuelto desactivando "Verify JWT" — no debería repetirse en Next.js con tu propio middleware de auth.
- Número de producción (GDL, +52 1 33 1973 4908) agregado y verificado, pendiente el paso de "registro" vía API (bloqueado por aprobación de nombre visible en Meta, no es tema de código).
- El botón "Guardar credenciales" de `config.html` es un placeholder sin terminar — no replicarlo tal cual, diseñar bien con el problema de seguridad de arriba en mente.

## Qué se necesita construir/analizar
1. `schema.prisma` traducido desde Supabase, resolviendo el almacenamiento seguro del access token de Meta.
2. Modelo de autenticación/autorización para asesores + aislamiento real por `empresa_id`.
3. Plan de migración de datos (leads/mensajes reales ya llegando) de Supabase Postgres → Postgres en Railway, sin perder historial ni cortar servicio.
4. Endpoint de envío de mensajes (no existe hoy) — Server Action/Route Handler llamando al Graph API de Meta.
5. Estrategia de corte: mantener el prototipo actual recibiendo mensajes mientras se construye el sistema nuevo en paralelo, y cuándo mover el webhook de Meta al nuevo endpoint.
