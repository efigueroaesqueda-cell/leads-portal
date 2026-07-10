/**
 * SUPABASE EDGE FUNCTION — WhatsApp Send Message
 * Nombre: whatsapp-send
 *
 * Recibe { lead_id, telefono, contenido } desde el portal,
 * envia el mensaje via Graph API de Meta y lo guarda en lp_mensajes.
 *
 * Secretos necesarios (Functions -> Secrets):
 *   WEBHOOK_SERVICE_ROLE_KEY   (ya existe, se reutiliza)
 *   WHATSAPP_ACCESS_TOKEN      (ya existe)
 *   WA_PHONE_NUMBER_ID         (agregar: phone_number_id desde el que se envia)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY      = Deno.env.get('WEBHOOK_SERVICE_ROLE_KEY');
const WA_ACCESS_TOKEN   = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  }

  try {
    const { lead_id, telefono, contenido } = await req.json();

    if (!lead_id || !telefono || !contenido) {
      return new Response(JSON.stringify({ error: 'Faltan datos: lead_id, telefono, contenido' }), { status: 400, headers: CORS_HEADERS });
    }

    const to = telefono.replace(/[^\d]/g, ''); // Meta espera solo digitos, sin '+'

    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: contenido },
      }),
    });

    const metaJson = await metaRes.json();

    if (!metaRes.ok) {
      console.error('❌ Error de Meta al enviar:', JSON.stringify(metaJson));
      return new Response(JSON.stringify({ error: metaJson }), { status: 502, headers: CORS_HEADERS });
    }

    const wa_message_id = metaJson.messages?.[0]?.id || null;
    console.log(`✅ Mensaje enviado via Meta: ${wa_message_id}`);

    const { error: insertErr } = await supabase.from('lp_mensajes').insert({
      lead_id,
      direccion: 'saliente',
      tipo: 'texto',
      contenido,
      wa_message_id,
      leido: true,
    });

    if (insertErr) {
      console.error('❌ Error guardando mensaje saliente:', JSON.stringify(insertErr));
    }

    const { error: updErr } = await supabase
      .from('lp_leads')
      .update({ ultimo_contacto: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', lead_id);

    if (updErr) console.error('❌ Error actualizando ultimo_contacto:', JSON.stringify(updErr));

    return new Response(JSON.stringify({ success: true, wa_message_id }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error('❌ Error procesando envío:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
