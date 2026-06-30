# HenryLeads — Portal de Leads CRM
### Cremalleras LR | Guadalajara, Jalisco

Portal de gestión de leads por WhatsApp — diseñado para manejar 150+ mensajes/día.

---

## 🚀 Módulos

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| 💬 Bandeja | `index.html` | Inbox de conversaciones WhatsApp |
| 📊 Pipeline | `pipeline.html` | Kanban por etapas del embudo |
| 👥 Leads CRM | `leads.html` | Tabla/grid de todos los leads |
| ⚙️ Config | `config.html` | Asesores, mensajes rápidos, automatizaciones |

## 🎭 Modo Demo

Agrega `?demo=1` a cualquier URL para ver datos simulados:
```
https://efigueroaesqueda-cell.github.io/leads-portal/index.html?demo=1
```

---

## 📦 Stack

- **Frontend:** HTML/CSS/JS vanilla — GitHub Pages
- **Base de datos:** Supabase (mismo proyecto que GAGA)
- **WhatsApp:** Meta Cloud API (número Guadalajara ya registrado con checkmark azul)
- **Webhook:** Supabase Edge Function (`whatsapp-webhook.js`)
- **Automatizaciones:** n8n (pendiente de configurar)

---

## ⚙️ Setup paso a paso

### 1. Crear tablas en Supabase
```
1. Ve a: https://supabase.com/dashboard/project/bgpugtgjbfseqwwcwpyd
2. SQL Editor → New query
3. Pega el contenido de supabase-schema.sql
4. Run ✅
```

### 2. Función SQL adicional
```sql
-- Ejecutar en SQL Editor de Supabase:
create or replace function increment_no_leidos(lead_id_param uuid)
returns void language sql as $$
  update lp_leads set no_leidos = no_leidos + 1 where id = lead_id_param;
$$;
```

### 3. Credenciales Meta (cuando tengas el teléfono)
```
1. Ir a: developers.facebook.com
2. Mi App → WhatsApp → Configuración
3. Copiar: Phone Number ID + WABA ID
4. Crear Access Token permanente:
   Meta Business Suite → Configuración → Usuarios del sistema → Nuevo usuario del sistema
   → Generar token → Seleccionar: whatsapp_business_messaging
5. Pegar credenciales en: config.html → WhatsApp API
```

### 4. Desplegar Edge Function (webhook)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Crear función
mkdir -p supabase/functions/whatsapp-webhook
cp whatsapp-webhook.js supabase/functions/whatsapp-webhook/index.ts

# Variables de entorno
supabase secrets set WA_VERIFY_TOKEN=cremalleras_lr_secret_2024
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>

# Deploy
supabase functions deploy whatsapp-webhook --project-ref bgpugtgjbfseqwwcwpyd
```

### 5. Configurar webhook en Meta
```
1. developers.facebook.com → Tu App → WhatsApp → Configuración
2. Webhook → Agregar URL:
   https://bgpugtgjbfseqwwcwpyd.supabase.co/functions/v1/whatsapp-webhook
3. Verify Token: cremalleras_lr_secret_2024
4. Suscribir a: messages ✅
```

### 6. Publicar en GitHub Pages
```bash
# En COWORK MASTER/leads-portal/:
git init
git add .
git commit -m "HenryLeads v1.0 — Portal Cremalleras LR"
git remote add origin https://github.com/efigueroaesqueda-cell/leads-portal.git
git branch -M main
git push -u origin main
# Activar Pages en: Settings → Pages → Source: main / root
```

---

## 💬 Flujo de mensajes

```
Cliente escribe en WA
        ↓
Meta Cloud API
        ↓
Supabase Edge Function (webhook)
        ↓
lp_mensajes + lp_leads (Supabase DB)
        ↓
Portal (GitHub Pages) — Realtime subscription
        ↓
Asesor ve el mensaje en la bandeja y responde
        ↓
Portal → Meta API → Cliente
```

---

## 👥 Tipos de cliente

| Tipo | Protocolo | Descuento | Seguimiento |
|------|-----------|-----------|-------------|
| 👤 Usuario Final | Empatía → diagnóstico → cotización | — | 1 hora |
| 🔧 Mecánico | Flujo rápido + Programa Alianza | 5% | 20-25 min |
| 🏪 Refaccionaria | Precio especial mayoreo | Negociable | 20 min |

---

## 🔮 Roadmap

- [x] Bandeja de entrada
- [x] Pipeline Kanban
- [x] CRM de leads
- [x] Mensajes rápidos
- [ ] Integración Meta Cloud API (credenciales pendientes)
- [ ] Edge Function webhook desplegada
- [ ] n8n para automatizaciones
- [ ] Cotizaciones PDF
- [ ] App móvil (PWA)
- [ ] Henry's Diagnostics (módulo)
- [ ] La Refa Automotriz (módulo)

---

**Henry's Diagnostics | Enrique Figueroa | 2026**
