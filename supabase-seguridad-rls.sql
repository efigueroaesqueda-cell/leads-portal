-- ============================================================
-- CIERRE DE SEGURIDAD — HenryLeads / Supabase
-- Fecha: 2026-07-13
--
-- QUÉ HACE: activa Row Level Security (RLS) en todas las tablas lp_
-- y solo deja entrar a los usuarios AUTENTICADOS (asesores que
-- iniciaron sesión). El rol público "anon" (la llave que está en las
-- páginas) deja de poder leer/escribir la base. Con esto, aunque la
-- llave pública sea visible, ya no sirve para robar datos.
--
-- POR QUÉ ES SEGURO PARA LA APP:
--  - La app real ya manda el token de sesión del usuario logueado
--    (no la llave anónima) al pedir datos, así que sigue funcionando.
--  - El webhook y el envío (Edge Functions) usan la service_role key,
--    que IGNORA RLS, así que siguen funcionando sin cambios.
--
-- CÓMO USARLO: pegar TODO este bloque en Supabase → SQL Editor → RUN.
-- ============================================================

-- ---- PASO 1: activar RLS + política "solo autenticados" en cada tabla lp_ ----
do $$
declare t text;
begin
  foreach t in array array[
    'lp_empresas','lp_asesores','lp_etapas','lp_etiquetas','lp_leads',
    'lp_lead_etiquetas','lp_mensajes','lp_mensajes_rapidos',
    'lp_automatizaciones','lp_cotizaciones'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "auth_full_access" on %I;', t);
    execute format('create policy "auth_full_access" on %I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---- Verificación (opcional): ver que RLS quedó activado en todas ----
-- select relname, relrowsecurity from pg_class
--   where relname like 'lp_%' order by relname;


-- ============================================================
-- PASO 2 (OPCIONAL, hacer SOLO después de confirmar que el token
-- vive como secreto en Edge Functions → Secrets con el nombre
-- WHATSAPP_ACCESS_TOKEN). Borra el token de la tabla para que ni
-- por error quede guardado en la base. NO correr esto si el token
-- solo está en la tabla, porque entonces el envío dejaría de
-- funcionar.
-- ============================================================
-- update lp_empresas set wa_access_token = null;

-- Nota multi-tenant (futuro): hoy la política deja a cualquier
-- asesor logueado ver todo. Cuando se rente a varios negocios,
-- cambiar "using (true)" por un filtro por empresa_id.
