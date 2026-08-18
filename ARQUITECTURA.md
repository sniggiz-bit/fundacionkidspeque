# Fundación Kidspeque
## Documento de Arquitectura Técnica v1.0

---

## 📁 Estructura del Proyecto

```
fundacionkidspeque/
├── app/
│   ├── layout.tsx                    ← Layout raíz + metadatos SEO + Schema.org NGO
│   ├── page.tsx                      ← Landing page principal
│   ├── globals.css                   ← Design tokens + componentes Tailwind
│   └── api/
│       ├── donations/
│       │   └── initiate/route.ts     ← POST: Iniciar donación + redirigir al gateway
│       └── webhooks/
│           └── payment/route.ts      ← POST: Receptor de webhooks (Webpay/Flow/Stripe)
│
├── components/
│   ├── Navbar.tsx                    ← Sticky navbar responsive con menú mobile
│   ├── Hero.tsx                      ← Sección hero con animaciones Framer Motion
│   ├── DreamCard.tsx                 ← Card de campaña crowdfunding (barra de progreso animada)
│   ├── DreamsSection.tsx             ← Carrusel de sueños activos (Embla Carousel)
│   ├── DonationWizard.tsx            ← Wizard 3 pasos: monto → datos → pago
│   ├── StoreSection.tsx              ← Tienda solidaria con cards de productos
│   └── Footer.tsx                    ← Footer completo con datos legales NGO
│
├── types/
│   └── index.ts                      ← Interfaces TypeScript del modelo de dominio
│
├── lib/
│   └── schema.sql                    ← Esquema PostgreSQL completo con triggers
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🎨 Sistema de Diseño

### Tokens de Color
| Token         | Valor HEX   | Uso                                  |
|---------------|-------------|--------------------------------------|
| primary-600   | `#4f46e5`   | Color primario (índigo profundo)     |
| accent-500    | `#f59e0b`   | CTAs exclusivamente (ámbar cálido)   |
| neutral-900   | `#171717`   | Texto principal                      |
| neutral-600   | `#525252`   | Texto secundario                     |
| success       | `#10b981`   | Éxito (financiado, checkmarks)       |

### Tipografía
- **Display/Headings:** Plus Jakarta Sans (pesos 600–800)
- **Body/UI:** Inter (pesos 400–600)

---

## 🗄️ Modelo de Base de Datos

### Diagrama Entidad-Relación (simplificado)

```
contributors ──┐
               ├── donations ──── dreams
products ──────┘

collaborators (entidad independiente)
```

### Relaciones clave
- `donations.contributor_id` → `contributors.id` (FK RESTRICT)
- `donations.dream_id`       → `dreams.id` (FK RESTRICT)
- `products.related_dream_id`→ `dreams.id` (FK SET NULL)

### Triggers automáticos
- `trg_update_dream_stats`: recalcula `raised_amount`, `donor_count` y `progress_pct` en cada donación confirmada
- `trg_dreams_public_id`: genera automáticamente `SUEÑO-0001`, `SUEÑO-0002`, etc.
- `trg_*_updated_at`: actualiza `updated_at` en todas las tablas

---

## 💳 Flujo de Donación (< 3 clicks)

### Paso 1 — Elegir Monto (Click 1)
1. Usuario ve el Wizard de Donación en la sección `#donar`
2. Selecciona el sueño del dropdown (pre-seleccionado si viene de una DreamCard)
3. **Click en monto preset** (ej: $10.000) → monto seleccionado automáticamente
4. Click en **"Continuar"** → avanza al paso 2

### Paso 2 — Datos Personales (Click 2)
1. Ingresa nombre, apellido y email (mínimo requerido)
2. RUT opcional (para boleta tributaria)
3. Acepta envío de newsletter (opcional)
4. Click en **"Ir al pago"** → avanza al paso 3

### Paso 3 — Confirmación y Pago (Click 3 = DONE)
1. Ve resumen: sueño elegido + monto + nombre
2. Selecciona método de pago (Webpay, Flow, Mercado Pago, Stripe)
3. Click en **"Donar $10.000"**
   - → `POST /api/donations/initiate`
   - → DB guarda donación con `status: 'pending'`
   - → Recibe `redirectUrl` del gateway
   - → Redirige automáticamente al portal de pago

**Post-pago:**
- Gateway envía webhook a `POST /api/webhooks/payment?gateway=webpay_plus`
- Se verifica firma HMAC-SHA256
- Se actualiza `status: 'confirmed'` en DB
- Trigger recalcula `raised_amount` del sueño en tiempo real
- Email de recibo enviado al donante

**Total: 3 clicks · ≈ 45 segundos promedio**

---

## 🔒 Seguridad Implementada

| Capa                 | Medida                                                          |
|---------------------|-----------------------------------------------------------------|
| Headers HTTP         | CSP, HSTS, X-Frame-Options, X-Content-Type-Options             |
| CSRF                 | Verificación de cabecera `Origin` en todas las rutas API       |
| Webhooks             | Verificación HMAC-SHA256 por gateway                           |
| Datos sensibles      | RUT cifrado (pgcrypto), solo hash expuesto para búsqueda       |
| Pagos                | Nunca se almacenan datos de tarjeta (delegado al gateway)      |
| Idempotencia         | UNIQUE constraint en `(gateway, gateway_transaction_id)`       |
| Input sanitization   | Zod schemas con tipos estrictos en todas las APIs              |
| Inyección SQL        | ORM (Prisma/Drizzle) con prepared statements                   |

---

## 🚀 Performance (Target: 95+ Lighthouse)

- **SSG** para páginas estáticas (home, tienda, nosotros)
- **SSR** para páginas de sueños individuales (datos en tiempo real)
- **ISR** (Incremental Static Regeneration) para la grid de sueños (revalidar cada 60s)
- Imágenes con `next/image`: AVIF + WebP, lazy loading, blur placeholder
- Fonts con `next/font`: carga óptima, sin layout shift
- `removeConsole: true` en producción

---

## ♿ Accesibilidad (WCAG 2.1 AA)

- Todos los botones tienen `aria-label` descriptivos
- Barra de progreso usa `role="progressbar"` con `aria-valuenow/min/max`
- Carrusel tiene controles con `aria-label`
- Focus visible en todos los elementos interactivos
- Contraste de colores: ratio mínimo 4.5:1 en todos los textos
- Formularios con `<label>` asociados y mensajes de error con `role="alert"`
- Menú mobile con `aria-expanded` y `aria-controls`

---

## 📦 Stack Tecnológico

| Capa            | Tecnología                                            |
|----------------|-------------------------------------------------------|
| Frontend        | Next.js 14+ (App Router) + TypeScript + Tailwind CSS |
| Animaciones     | Framer Motion                                         |
| Carrusel        | Embla Carousel (sin overhead)                         |
| Forms           | React Hook Form + Zod                                 |
| State global    | Zustand (carrito, donaciones en tiempo real)          |
| Data fetching   | TanStack Query v5                                     |
| Base de datos   | PostgreSQL 16+ con triggers                           |
| ORM             | Prisma o Drizzle ORM                                  |
| CMS             | Sanity / PayloadCMS (headless)                        |
| Pagos nacionales| Transbank Webpay Plus + Flow.cl                       |
| Pagos LATAM     | Mercado Pago                                          |
| Pagos inter.    | Stripe                                                |
| Email           | Resend / Brevo (recibos transaccionales)              |
| Hosting         | Vercel (Edge Functions) + Neon/Supabase               |
| CDN imágenes    | Cloudinary / Vercel Blob                              |
| Monitoreo       | Sentry + Vercel Analytics                             |

---

## 📋 Próximos Pasos

1. [ ] Instalar dependencias: `npm install`
2. [ ] Configurar variables de entorno (`.env.local`)
3. [ ] Conectar base de datos PostgreSQL (Supabase o Neon recomendado)
4. [ ] Configurar Prisma/Drizzle con el schema SQL
5. [ ] Implementar CMS (Sanity recomendado para no-técnicos)
6. [ ] Configurar cuentas de gateways de pago (sandbox primero)
7. [ ] Deploy en Vercel con dominio `kidspeque.cl`
8. [ ] Configurar webhooks en cada gateway con la URL de producción
9. [ ] Pruebas de carga y auditoría Lighthouse
10. [ ] Auditoría de seguridad y revisión legal

---

*Documento generado como entregable de arquitectura para cliente — Fundación Kidspeque 2025*
