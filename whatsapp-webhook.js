/**
 * SUPABASE EDGE FUNCTION — WhatsApp Webhook Receiver
 * Nombre: whatsapp-webhook
 *
 * Deploy: supabase functions deploy whatsapp-webhook
 * URL:    https://bgpugtgjbfseqwwcwpyd.supabase.co/functions/v1/whatsapp-webhook
 *
 * Configura en Meta: App → WhatsApp → Configuración → Webhook → Agregar URL
 * Eventos suscritos: messages
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY     = Deno.env.get('WEBHOOK_SERVICE_ROLE_KEY'); // Supabase dejo de auto-inyectar SUPABASE_SERVICE_ROLE_KEY (migro a SUPABASE_SECRET_KEYS); este secreto se agrego a mano el 2026-07-09
const VERIFY_TOKEN     = Deno.env.get('WA_VERIFY_TOKEN');    // el que defines tú
const EMPRESA_ID       = '11111111-0000-0000-0000-000000000001';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── VERIFICACIÓN DEL WEBHOOK (GET) ────────────────────────
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Token inválido', { status: 403 });
  }

  // ── RECEPCIÓN DE MENSAJES (POST) ──────────────────────────
  if (req.method === 'POST') {
    const body = await req.json();
    console.log('📨 Webhook recibido:', JSON.stringify(body));

    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Mensajes entrantes
      const messages = value?.messages;
      if (messages?.length) {
        for (const msg of messages) {
          await handleIncomingMessage(msg, value.contacts?.[0]);
        }
      }

      // Actualizaciones de estado (sent/delivered/read)
      const statuses = value?.statuses;
      if (statuses?.length) {
        for (const status of statuses) {
          await handleStatusUpdate(status);
        }
      }

    } catch (err) {
      console.error('❌ Error procesando webhook:', err);
    }

    return new Response('OK', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});

async function handleIncomingMessage(msg, contact) {
  const telefono = '+' + msg.from;  // Meta envía sin el +
  const wa_message_id = msg.id;
  const contenido = msg.text?.body || '[Mensaje no textual]';
  const tipo = msg.type || 'texto';
  const timestamp = new Date(parseInt(msg.timestamp) * 1000).toISOString();

  // Buscar o crear lead
  const { data: leads, error: findErr } = await supabase
    .from('lp_leads')
    .select('id, nombre')
    .eq('empresa_id', EMPRESA_ID)
    .eq('telefono', telefono)
    .limit(1);

  if (findErr) {
    console.error('❌ Error buscando lead:', JSON.stringify(findErr));
    return;
  }

  let leadId;
  if (leads?.length) {
    leadId = leads[0].id;
    // Incrementar contador de no leídos
    const { error: incErr } = await supabase.rpc('increment_no_leidos', { lead_id_param: leadId });
    if (incErr) console.error('❌ Error incrementando no_leidos:', JSON.stringify(incErr));
  } else {
    // Crear nuevo lead
    const nombre = contact?.profile?.name || null;
    const { data: etapas, error: etapasErr } = await supabase
      .from('lp_etapas')
      .select('id')
      .eq('empresa_id', EMPRESA_ID)
      .order('orden')
      .limit(1);

    if (etapasErr) console.error('❌ Error leyendo etapas:', JSON.stringify(etapasErr));

    const { data: newLead, error: leadErr } = await supabase
      .from('lp_leads')
      .insert({
        empresa_id: EMPRESA_ID,
        nombre,
        telefono,
        wa_contact_id: msg.from,
        etapa_id: etapas?.[0]?.id || null,
        no_leidos: 1,
        ultimo_contacto: timestamp,
      })
      .select('id')
      .single();

    if (leadErr) {
      console.error('❌ Error creando lead:', JSON.stringify(leadErr));
      return;
    }

    leadId = newLead?.id;
    console.log(`✅ Nuevo lead creado: ${nombre} (${telefono})`);
  }

  if (!leadId) {
    console.error('❌ No se obtuvo leadId, no se guarda el mensaje');
    return;
  }

  // Guardar mensaje
  const { error: msgErr } = await supabase.from('lp_mensajes').insert({
    lead_id: leadId,
    direccion: 'entrante',
    tipo: tipo === 'text' ? 'texto' : tipo,
    contenido,
    wa_message_id,
    leido: false,
    created_at: timestamp,
  });

  if (msgErr) {
    console.error('❌ Error guardando mensaje:', JSON.stringify(msgErr));
    return;
  }

  // Actualizar último contacto del lead
  const { error: updErr } = await supabase
    .from('lp_leads')
    .update({ ultimo_contacto: timestamp, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (updErr) console.error('❌ Error actualizando ultimo_contacto:', JSON.stringify(updErr));

  console.log(`✅ Mensaje guardado para lead ${leadId}`);
}

async function handleStatusUpdate(status) {
  // Actualizar estado del mensaje (enviado/entregado/leído)
  if (status.wa_message_id) {
    const { error } = await supabase
      .from('lp_mensajes')
      .update({ leido: status.status === 'read' })
      .eq('wa_message_id', status.wa_message_id);
    if (error) console.error('❌ Error actualizando estado de mensaje:', JSON.stringify(error));
  }
}

/*
 * ── FUNCIÓN SQL necesaria en Supabase ────────────────────────
 * Ejecuta esto en el SQL Editor de Supabase:
 *
 * create or replace function increment_no_leidos(lead_id_param uuid)
 * returns void language sql as $$
 *   update lp_leads set no_leidos = no_leidos + 1 where id = lead_id_param;
 * $$;
 */
