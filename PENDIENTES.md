# Pendientes de HenryLeads

Cosas que quedaron anotadas para retomar más adelante, no urgentes hoy.

- **Automatizaciones (seguimiento post-cotización, etc.):** decidido NO usar n8n — se construye directo en código (más simple y sin costo extra de suscripción). Falta diseñar la primera automatización real cuando Enrique esté listo.
  - **Referencia encontrada (2026-07-12):** video de Carlos Eduardo Rueda Martell (facebook.com/share/v/1Z3r42cLHD, publicado 2026-06-26) mostrando n8n + Claude clasificando la intención de un mensaje entrante y actualizando automáticamente los Custom Fields de un contacto en GoHighLevel (CRM). Es el mismo patrón que necesitamos (clasificar intención → actualizar campo/etapa del lead), pero para HenryLeads iría 100% en código (webhook → función de clasificación en el backend propio → update a `lp_leads`), sin n8n ni GoHighLevel. Útil como referencia visual del flujo, no como receta a copiar tal cual.

- **Multi-línea de WhatsApp ("Líneas"/"Números conectados"):** idea de conectar varios números de WhatsApp Business (propiedad del negocio, asignados a trabajadores — no números personales) dentro del mismo sistema, cada uno con su propia bandeja y asesor asignado. Es un uso soportado de forma normal por la API de WhatsApp Business (una misma cuenta de Meta Business puede tener varios números). Limitación que se mantiene sin importar cuántos números se conecten: la API de WhatsApp Business **no da acceso a grupos de WhatsApp**, es límite de la plataforma. Falta definir cuántas líneas se necesitan y cómo se asignan antes de construirlo.
  - **Cuándo retomarlo:** Enrique pidió explícitamente dejarlo en pausa hasta la **recta final del proyecto** (no antes) — cuando lleguemos ahí, explicarle de nuevo con más detalle antes de construir.

- **Notas internas por lead (estilo LeadSeal) — TERMINADO primera versión (2026-07-12), solo en Bandeja.** Se implementaron las dos partes que Enrique decidió:
  - **B:** nota interna como bloque especial dentro de la línea de tiempo del chat, centrado (no alineado izquierda/derecha como los mensajes reales), fondo amarillo punteado, etiqueta "NOTA INTERNA" en mayúsculas — visualmente imposible de confundir con un mensaje real. Se crea desde el menú de Adjuntar ("📌 Nota interna"), en un modal separado con aviso explícito de que el cliente nunca la ve — así es técnicamente imposible que se envíe por error (no comparte código con `sendMessage()`, no toca WhatsApp).
  - **A:** listado de esas notas en la ficha del lead (Perfil → Notas internas); clic en una nota cierra el perfil y salta directo a ese punto del chat con un resaltado breve.
  - Verificado que agregar una nota NO actualiza el "último contacto"/preview de la bandeja (esa es información del cliente, la nota no lo es).
  - Pendiente para después: si vale la pena, editar/eliminar una nota ya creada (hoy solo se pueden agregar).

- **Investigación de competencia — DESCARTADA por ahora (2026-07-12).** Enrique confirmó que no es necesaria en este momento. El agente que se había lanzado no dejó un reporte guardado en ningún archivo; si más adelante se retoma, hay que lanzarla de nuevo y esta vez guardar el resultado en un archivo.

- **Transcripción de audio a texto (como WhatsApp) — DESCARTADA por ahora (2026-07-12).** Requiere servicio pagado de voz-a-texto; Enrique confirmó que no la necesitamos por el momento. Si se retoma: no fingir con texto falso, es una función real a construir cuando se decida pagar ese servicio.

- **Modo claro/oscuro — TERMINADO (2026-07-11, ampliado 2026-07-12).** Interruptor en Configuración → Apariencia con 3 opciones: Oscuro, Claro y Automático (cambia solo por horario: claro de 7am a 7pm, oscuro el resto, para no dañar la vista). Aplicado en las 4 pantallas, guardado en `localStorage`. Se corrigió además el contraste del modo claro (bordes y texto terciario casi invisibles sobre blanco).

- **Reacciones a mensajes (estilo WhatsApp) — TERMINADO (2026-07-12), solo en Bandeja.** Botón "🙂" aparece al pasar el mouse sobre cualquier mensaje, abre un selector con 6 reacciones rápidas (👍❤️😂😮😢🙏) más grandes con animación de aparición; tocar la reacción de nuevo la quita. Agregado como paso nuevo en el recorrido guiado.

- **Selector de emojis para redactar mensajes — TERMINADO (2026-07-12), solo en Bandeja.** Botón junto a Adjuntar, inserta el emoji en el punto del cursor. Agregado como paso nuevo en el recorrido guiado.

- **Reenviar mensajes entre chats — TERMINADO (2026-07-12), solo en Bandeja.** Cualquier mensaje se puede reenviar a uno o varios chats a la vez (selector con búsqueda y multi-selección). Siempre queda marcado "Reenviado · originalmente de X", y ese origen se preserva aunque el mensaje se reenvíe varias veces en cadena — para poder rastrear de dónde vino algo si pasó por varios chats. Agregado como paso nuevo en el recorrido guiado. De paso se corrigió que los mensajes enviados/reenviados desaparecían al cambiar de chat y volver (ahora se cachean por lead durante la sesión).

- **Iconos de branding pendientes de revisión más a fondo (2026-07-12).** Enrique pidió aplicar el skill de Apple Design a los botones (todavía no se hizo, solo se aplicó el de Emil Kowalski) y quiere una pasada general de "todo lo tapeable debe sentirse como botón" — ya se cubrió una primera ronda (menú de Configuración, fila de respuestas rápidas, adjuntar, reproductor de audio, etiquetas, lightbox, sidebar) pero falta auditar el resto del sistema (Pipeline, Leads) con el mismo criterio.

- **Chat interno de la empresa — Enrique confirmó que SÍ lo quiere (2026-07-12), escala grande.** 100% interno, no depende de WhatsApp/Meta, cualquiera frente a una computadora de la empresa tiene acceso. Muchos usuarios, grupos e individuales, todo tipo de contenido (texto/imagen/video/documento/nota de voz) que corra por el negocio — reutilizando gran parte de lo que ya existe para el chat con clientes. Llamadas de voz/video quedan aparte, como fase futura distinta (WebRTC, no es un simple agregado). Falta sentarse a definir dónde vive en la pantalla para no mezclarlo visualmente con el chat de clientes (evitar que alguien mande algo interno a un cliente por error). Recomendación: usar Opus para diseñar la arquitectura de esto, es del tipo "no puede fallar" (fuga de info interna a un chat de cliente sería grave).

- **Primera automatización real (clasificar palabras clave → mover de embudo) — propuesta por Enrique (2026-07-12), sin construir aún.** Idea: cuando se contesta un mensaje que contiene ciertas palabras clave, mover automáticamente el lead a otra etapa del embudo. Es 100% en código (sin n8n). Falta definir junto con Enrique: qué palabras clave, a qué etapa mueve cada una, y si es al contestar o también al recibir.

- **Conexión de WhatsApp — pendiente de decidir el enfoque (2026-07-12).** Enrique propuso simplificarla a un QR estilo WhatsApp Web. Se le explicó que eso es una tecnología distinta e incompatible con la API oficial de Meta que ya se usa (y con riesgo real de baneo, mismo tema que la guía de OpenWA que ya se le había marcado como riesgosa) — no se construyó. Falta confirmar si lo que quiere es esconder los campos técnicos (Phone Number ID/WABA ID/Token) para todos menos el admin, y solo mostrarle a los demás un "✅ Conectado" simple.

- **Respuestas rápidas privadas/compartidas — TERMINADO (2026-07-12).** Al crear una nueva (desde Configuración o desde "/" en el chat) se puede elegir compartirla con el equipo o dejarla privada. Las 5 de fábrica siguen compartidas. Nota: en el sandbox, Configuración y Bandeja tienen datos de prueba separados, así que no se ven reflejadas entre sí en la demo (sí lo harán en el sistema real).

- **Tour: se corrigió que decía que las notas de voz salían de "Adjuntar"** cuando en realidad usan el botón de micrófono aparte — ya están separados en dos pasos del recorrido guiado.

- **Bandeja compactada, tooltips arreglados en modo claro, ubicación del negocio simplificada a un campo + link de Maps, fondo de chat personalizable, indicador de nota interna en el avatar del lead, buscador en Pipeline, y gesto de 2 dedos acotado a Bandeja↔Pipeline — TODO TERMINADO (2026-07-12).** Ver detalle en el historial de git. El gesto de 2 dedos no se pudo probar en hardware real (touch/trackpad) desde aquí — Enrique debe confirmar que se sienta bien y avisar si hay que ajustar la sensibilidad.

- **Auditoría de "todo lo tapeable se siente como botón" en Pipeline y Leads — sigue pendiente**, ya se hizo la primera ronda en Bandeja y Configuración (ver arriba, 2026-07-12).
