-- ============================================================
-- LEADS PORTAL — Schema Supabase
-- Proyecto: Multi-tenant (Henry's, Cremalleras LR, La Refa)
-- Versión: 1.0 | 2026-06-29
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Proyecto: bgpugtgjbfseqwwcwpyd (mismo que GAGA)
-- ============================================================

-- ── 1. EMPRESAS ──────────────────────────────────────────────
create table if not exists lp_empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text unique not null,
  telefono_wa text,           -- número WhatsApp Business registrado
  wa_phone_number_id text,    -- Phone Number ID de Meta
  wa_access_token    text,    -- Token de acceso Meta (guardar aquí o en Edge Function env)
  color_marca text default '#c8a951',
  activa      boolean default true,
  created_at  timestamptz default now()
);

-- ── 2. ASESORES ──────────────────────────────────────────────
create table if not exists lp_asesores (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references lp_empresas(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  rol         text default 'asesor',  -- 'admin', 'asesor', 'jefe'
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- ── 3. ETAPAS DEL EMBUDO ─────────────────────────────────────
create table if not exists lp_etapas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references lp_empresas(id) on delete cascade,
  nombre      text not null,
  orden       int not null default 0,
  color       text default '#888888',
  icono       text default '📋',
  created_at  timestamptz default now()
);

-- ── 4. ETIQUETAS ─────────────────────────────────────────────
create table if not exists lp_etiquetas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references lp_empresas(id) on delete cascade,
  nombre      text not null,
  color       text default '#888888',
  created_at  timestamptz default now()
);

-- ── 5. LEADS ─────────────────────────────────────────────────
create table if not exists lp_leads (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid references lp_empresas(id) on delete cascade,
  asesor_id       uuid references lp_asesores(id) on delete set null,
  etapa_id        uuid references lp_etapas(id) on delete set null,
  nombre          text,
  telefono        text not null,
  wa_contact_id   text,           -- WhatsApp contact ID
  tipo_cliente    text default 'usuario_final',
                  -- 'usuario_final' | 'mecanico' | 'refaccionaria'
  vehiculo_info   text,           -- "Corolla 2018 diesel"
  notas           text,
  ultimo_contacto timestamptz,
  no_leidos       int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 6. LEAD ↔ ETIQUETAS (many-to-many) ───────────────────────
create table if not exists lp_lead_etiquetas (
  lead_id     uuid references lp_leads(id) on delete cascade,
  etiqueta_id uuid references lp_etiquetas(id) on delete cascade,
  primary key (lead_id, etiqueta_id)
);

-- ── 7. MENSAJES ──────────────────────────────────────────────
create table if not exists lp_mensajes (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references lp_leads(id) on delete cascade,
  asesor_id     uuid references lp_asesores(id) on delete set null,
  direccion     text not null,  -- 'entrante' | 'saliente'
  tipo          text default 'texto',  -- 'texto' | 'imagen' | 'audio' | 'documento'
  contenido     text not null,
  wa_message_id text,           -- ID del mensaje en Meta
  leido         boolean default false,
  created_at    timestamptz default now()
);

-- ── 8. MENSAJES RÁPIDOS ──────────────────────────────────────
create table if not exists lp_mensajes_rapidos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references lp_empresas(id) on delete cascade,
  titulo      text not null,
  contenido   text not null,
  categoria   text,  -- 'bienvenida' | 'cotizacion' | 'seguimiento' | 'cierre' | 'mecanico'
  orden       int default 0,
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- ── 9. AUTOMATIZACIONES ──────────────────────────────────────
create table if not exists lp_automatizaciones (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid references lp_empresas(id) on delete cascade,
  nombre          text not null,
  trigger_tipo    text,   -- 'tiempo_sin_respuesta' | 'etapa_cambiada' | 'etiqueta_agregada'
  trigger_valor   jsonb,  -- { "minutos": 60, "etapa_id": "..." }
  accion_tipo     text,   -- 'enviar_mensaje' | 'mover_etapa' | 'asignar_asesor'
  accion_valor    jsonb,  -- { "mensaje_rapido_id": "..." }
  activa          boolean default true,
  created_at      timestamptz default now()
);

-- ── 10. COTIZACIONES ─────────────────────────────────────────
create table if not exists lp_cotizaciones (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references lp_leads(id) on delete cascade,
  asesor_id   uuid references lp_asesores(id) on delete set null,
  folio       text,
  descripcion text,
  monto_total numeric(10,2),
  url_pdf     text,
  estado      text default 'borrador',  -- 'borrador' | 'enviada' | 'aceptada' | 'rechazada'
  created_at  timestamptz default now()
);

-- ── ÍNDICES ───────────────────────────────────────────────────
create index if not exists idx_lp_leads_empresa     on lp_leads(empresa_id);
create index if not exists idx_lp_leads_asesor      on lp_leads(asesor_id);
create index if not exists idx_lp_leads_etapa       on lp_leads(etapa_id);
create index if not exists idx_lp_mensajes_lead     on lp_mensajes(lead_id);
create index if not exists idx_lp_mensajes_created  on lp_mensajes(created_at desc);

-- ── REALTIME ─────────────────────────────────────────────────
-- Habilitar realtime para actualizaciones en vivo
alter publication supabase_realtime add table lp_mensajes;
alter publication supabase_realtime add table lp_leads;

-- ── SEED DATA: Cremalleras LR ─────────────────────────────────
-- ¡IMPORTANTE! Reemplazar wa_phone_number_id y wa_access_token cuando tengas credenciales Meta

insert into lp_empresas (id, nombre, slug, telefono_wa, color_marca) values
  ('11111111-0000-0000-0000-000000000001', 'Cremalleras LR', 'cremalleras-lr', '+523312345678', '#c8a951');

-- Etapas del embudo para Cremalleras LR
insert into lp_etapas (empresa_id, nombre, orden, color, icono) values
  ('11111111-0000-0000-0000-000000000001', 'Pendiente',   1, '#888888', '⏳'),
  ('11111111-0000-0000-0000-000000000001', 'Contestado',  2, '#3498db', '💬'),
  ('11111111-0000-0000-0000-000000000001', 'Prospecto',   3, '#9b59b6', '🎯'),
  ('11111111-0000-0000-0000-000000000001', 'Cotizado',    4, '#f39c12', '📋'),
  ('11111111-0000-0000-0000-000000000001', 'Agendado',    5, '#1abc9c', '📅'),
  ('11111111-0000-0000-0000-000000000001', 'Cerrado',     6, '#2ecc71', '✅');

-- Etiquetas
insert into lp_etiquetas (empresa_id, nombre, color) values
  ('11111111-0000-0000-0000-000000000001', 'Mecánico Alianza', '#27ae60'),
  ('11111111-0000-0000-0000-000000000001', 'Precio Especial',  '#e74c3c'),
  ('11111111-0000-0000-0000-000000000001', 'Urgente',          '#e74c3c'),
  ('11111111-0000-0000-0000-000000000001', 'Cotización Enviada','#f39c12'),
  ('11111111-0000-0000-0000-000000000001', 'Cliente Frecuente','#c8a951'),
  ('11111111-0000-0000-0000-000000000001', 'Sin Respuesta',    '#95a5a6');

-- Asesores de Cremalleras LR
insert into lp_asesores (id, empresa_id, nombre, telefono, rol) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Luis R.',    '+523387654321', 'admin'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Karla M.',   '+523398765432', 'asesor'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Diego V.',   '+523309876543', 'asesor');

-- Mensajes rápidos para Cremalleras LR
insert into lp_mensajes_rapidos (empresa_id, titulo, contenido, categoria, orden) values
  ('11111111-0000-0000-0000-000000000001',
   'Bienvenida',
   '¡Hola! Gracias por contactar a Cremalleras LR 🚗 Somos especialistas en dirección automotriz. ¿En qué te podemos ayudar hoy?',
   'bienvenida', 1),
  ('11111111-0000-0000-0000-000000000001',
   'Datos del vehículo',
   'Para darte la mejor asesoría, necesito algunos datos de tu vehículo: ¿Cuál es la marca, modelo y año? ¿Qué síntoma presenta la dirección?',
   'bienvenida', 2),
  ('11111111-0000-0000-0000-000000000001',
   'Bienvenida Mecánico',
   '¡Hola colega! Bienvenido a Cremalleras LR 🔧 Como mecánico, tienes acceso a precios especiales y nuestro Programa de Alianza. ¿Qué pieza necesitas?',
   'mecanico', 1),
  ('11111111-0000-0000-0000-000000000001',
   'Cotización lista',
   'Te comparto la cotización de tu cremallera 👆 Incluye la pieza garantizada y mano de obra si la quieres aquí con nosotros. ¿Tienes alguna pregunta?',
   'cotizacion', 1),
  ('11111111-0000-0000-0000-000000000001',
   'Seguimiento 1h',
   'Hola, te escribo para ver si tuviste oportunidad de revisar la cotización que te enviamos. Estamos para cualquier duda 😊',
   'seguimiento', 1),
  ('11111111-0000-0000-0000-000000000001',
   'Seguimiento Mecánico 20min',
   '¿Cómo van con la dirección? Si ya tienes los datos del vehículo te cotizo en minutos. Recuerda que como aliado tienes el 5% de descuento 💪',
   'mecanico', 2),
  ('11111111-0000-0000-0000-000000000001',
   'Cita confirmada',
   'Tu cita quedó agendada ✅ Te esperamos el [FECHA] a las [HORA]. Dirección: [DIRECCION]. ¿Alguna duda?',
   'cierre', 1),
  ('11111111-0000-0000-0000-000000000001',
   'Cierre de venta',
   'Perfecto, con gusto te preparamos tu pedido. El tiempo de entrega es [TIEMPO]. ¿Prefieres pago en efectivo, tarjeta o transferencia? 🙌',
   'cierre', 2);
