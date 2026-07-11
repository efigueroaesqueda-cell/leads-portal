# Pendientes de HenryLeads

Cosas que quedaron anotadas para retomar más adelante, no urgentes hoy.

- **Automatizaciones (seguimiento post-cotización, etc.):** decidido NO usar n8n — se construye directo en código (más simple y sin costo extra de suscripción). Falta diseñar la primera automatización real cuando Enrique esté listo.

- **Chat interno de la empresa (confirmado como proyecto, sin construir aún).** Uso: cualquiera frente a una computadora de la empresa tiene acceso, 100% interno, no depende de WhatsApp/Meta. Debe incluir: texto, imágenes/documentos, notas de voz, reenviar mensajes entre chats, y chats grupales internos — todo esto es fácil de construir reutilizando lo que ya existe para el chat con clientes. Llamadas de voz/video quedan aparte, como fase futura distinta (tecnología distinta, WebRTC, no es un simple agregado). Falta sentarse a definir el alcance concreto antes de empezar.

- **Multi-línea de WhatsApp ("Líneas"/"Números conectados"):** idea de conectar varios números de WhatsApp Business (propiedad del negocio, asignados a trabajadores — no números personales) dentro del mismo sistema, cada uno con su propia bandeja y asesor asignado. Es un uso soportado de forma normal por la API de WhatsApp Business (una misma cuenta de Meta Business puede tener varios números). Limitación que se mantiene sin importar cuántos números se conecten: la API de WhatsApp Business **no da acceso a grupos de WhatsApp**, es límite de la plataforma. Falta definir cuántas líneas se necesitan y cómo se asignan antes de construirlo.
  - **Cuándo retomarlo:** Enrique pidió explícitamente dejarlo en pausa hasta la **recta final del proyecto** (no antes) — cuando lleguemos ahí, explicarle de nuevo con más detalle antes de construir.

- **Notas internas por lead (estilo LeadSeal) — DECIDIDO, falta construir (2026-07-11).** Enrique eligió combinar las dos opciones:
  - **B (principal):** nota interna como mensaje especial dentro del mismo chat, en la línea de tiempo real, con estilo claramente distinto, nunca visible para el cliente — requiere diseño muy cuidadoso para que jamás se confunda con un mensaje real o se envíe por error.
  - **A (complemento):** además, un listado de esas notas en la ficha del lead; al hacer clic en una nota ahí, debe llevarte/saltar directo a ese punto exacto de la conversación en el chat.

- **Investigación de competencia — EN CURSO (lanzada 2026-07-11) mientras Enrique descansa.** Agente en background investigando plataformas del mercado (LeadSeal, Kommo, Chatwoot, Wati, Leadsales, etc.) para traer ideas de features adoptables. Revisar resultado y presentárselo a Enrique en la próxima sesión.
