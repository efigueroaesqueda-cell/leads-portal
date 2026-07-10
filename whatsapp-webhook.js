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

  // Buscar o crear lead (via funcion SECURITY DEFINER: anon ya no tiene acceso directo a las tablas)
  const { data: leadId, error: leadErr } = await supabase.rpc('wh_find_or_create_lead', {
    p_empresa_id: EMPRESA_ID,
    p_telefono: telefono,
    p_nombre: contact?.profile?.name || null,
    p_wa_contact_id: msg.from,
    p_timestamp: timestamp,
  });

  if (leadErr || !leadId) {
    console.error('❌ Error obteniendo/creando lead:', JSON.stringify(leadErr));
    return;
  }

  // Guardar mensaje
  const { error: msgErr } = await supabase.rpc('wh_insert_mensaje', {
    p_lead_id: leadId,
    p_direccion: 'entrante',
    p_tipo: tipo === 'text' ? 'texto' : tipo,
    p_contenido: contenido,
    p_wa_message_id: wa_message_id,
    p_leido: false,
    p_created_at: timestamp,
  });

  if (msgErr) {
    console.error('❌ Error guardando mensaje:', JSON.stringify(msgErr));
    return;
  }

  // Actualizar último contacto del lead
  const { error: updErr } = await supabase.rpc('wh_update_lead_contacto', {
    p_lead_id: leadId,
    p_timestamp: timestamp,
  });

  if (updErr) console.error('❌ Error actualizando ultimo_contacto:', JSON.stringify(updErr));

  console.log(`✅ Mensaje guardado para lead ${leadId}`);
}

async function handleStatusUpdate(status) {
  // Actualizar estado del mensaje (enviado/entregado/leído)
  if (status.wa_message_id) {
    const { error } = await supabase.rpc('wh_update_mensaje_estado', {
      p_wa_message_id: status.wa_message_id,
      p_leido: status.status === 'read',
    });
    if (error) console.error('❌ Error actualizando estado de mensaje:', JSON.stringify(error));
  }
}
