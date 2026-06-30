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
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
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
  let { data: leads } = await supabase
    .from('lp_leads')
    .select('id, nombre')
    .eq('empresa_id', EMPRESA_ID)
    .eq('telefono', telefono)
    .limit(1);

  let leadId;
  if (leads?.length) {
    leadId = leads[0].id;
    // Incrementar contador de no leídos
    await supabase.rpc('increment_no_leidos', { lead_id_param: leadId });
  } else {
    // Crear nuevo lead
    const nombre = contact?.profile?.name || null;
    const { data: etapas } = await supabase
      .from('lp_etapas')
      .select('id')
      .eq('empresa_id', EMPRESA_ID)
      .order('orden')
      .limit(1);

    const { data: newLead } = await supabase
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

    leadId = newLead?.id;
    console.log(`✅ Nuevo lead creado: ${nombre} (${telefono})`);
  }

  if (!leadId) return;

  // Guardar mensaje
  await supabase.from('lp_mensajes').insert({
    lead_id: leadId,
    direccion: 'entrante',
    tipo: tipo === 'text' ? 'texto' : tipo,
    contenido,
    wa_message_id,
    leido: false,
    created_at: timestamp,
  });

  // Actualizar último contacto del lead
  await supabase
    .from('lp_leads')
    .update({ ultimo_contacto: timestamp, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  console.log(`✅ Mensaje guardado para lead ${leadId}`);
}

async function handleStatusUpdate(status) {
  // Actualizar estado del mensaje (enviado/entregado/leído)
  if (status.wa_message_id) {
    await supabase
      .from('lp_mensajes')
      .update({ leido: status.status === 'read' })
      .eq('wa_message_id', status.wa_message_id);
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
