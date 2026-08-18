// ═══════════════════════════════════════════════════════════════════════════
//  KIDSPEQUE — FUNDACIÓN SOCIAL NIÑOS CREATIVOS
//  Esquema de Tipos TypeScript / Modelo de Dominio
//  Equivalente a las entidades de la base de datos PostgreSQL
// ═══════════════════════════════════════════════════════════════════════════

// ── ENUMERACIONES ────────────────────────────────────────────────────────────

/** Estado del ciclo de vida de un Sueño (campaña de crowdfunding) */
export type DreamStatus =
  | "draft"       // Borrador — aún no publicado
  | "active"      // Activo — recibiendo donaciones
  | "funded"      // Financiado — meta alcanzada
  | "completed"   // Completado — sueño cumplido y reportado
  | "paused"      // Pausado temporalmente
  | "cancelled";  // Cancelado

/** Estado de una transacción de donación */
export type DonationStatus =
  | "pending"     // En proceso en el gateway de pago
  | "confirmed"   // Confirmado por webhook del gateway
  | "failed"      // Fallido — pago rechazado
  | "refunded"    // Reembolsado
  | "disputed";   // En disputa

/** Gateway de pago utilizado */
export type PaymentGateway =
  | "webpay_plus"  // Transbank Webpay Plus — tarjetas nacionales CLP
  | "flow"         // Flow.cl — múltiples medios nacionales CLP
  | "paypal";      // PayPal — donaciones internacionales en USD

/** Categoría de un producto de la tienda solidaria */
export type ProductCategory =
  | "ropa_organica"   // Ropa de algodón orgánico
  | "delantales"      // Delantales resistentes a manchas
  | "pantalones"      // Pantalones de juego
  | "accesorios"      // Accesorios creativos
  | "kits";           // Kits creativos combinados

/** Tipo de colaborador del ecosistema */
export type CollaboratorType =
  | "psychologist"    // Psicólogo/a
  | "therapist"       // Terapeuta
  | "social_worker"   // Trabajador/a social
  | "artist"          // Artista/Facilitador creativo
  | "volunteer";      // Voluntario/a

// ── ENTIDADES PRINCIPALES ────────────────────────────────────────────────────

/**
 * CONTRIBUTOR — Persona que dona o participa en la plataforma
 * Equivale a la tabla `contributors` en PostgreSQL
 */
export interface Contributor {
  id: string;                    // UUID v4
  createdAt: Date;
  updatedAt: Date;

  // Datos personales (mínimo necesario — privacidad por defecto)
  firstName: string;
  lastName: string;
  email: string;                 // Único, indexado
  phone?: string;                // Opcional
  rut?: string;                  // RUT chileno — para boleta/factura

  // Dirección (opcional — solo si requiere factura)
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;             // ISO 3166-1 alpha-2 (e.g., "CL")
    postalCode?: string;
  };

  // Preferencias y estado
  isAnonymous: boolean;          // Si prefiere no mostrar su nombre públicamente
  newsletterConsent: boolean;    // GDPR / Ley 19.628 (Chile)
  totalDonated: number;          // Suma acumulada en CLP (desnormalizado para performance)
  donationCount: number;         // Contador total de donaciones

  // Relaciones (opcionales: no siempre se cargan)
  donations?: Donation[];
  orderItems?: OrderItem[];
}

/**
 * DREAM — Campaña de crowdfunding individual (un "sueño" de un niño/a)
 * Equivale a la tabla `dreams` en PostgreSQL
 */
export interface Dream {
  id: string;                    // UUID v4
  publicId: string;              // ID legible: "SUEÑO-0001", "SUEÑO-0042"
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // Información del sueño
  title: string;                 // e.g., "El sueño de Sofía: ser pintora"
  childName: string;             // Nombre del niño/a (o alias si es privado)
  childAge: number;              // Edad en años
  story: string;                 // Historia en texto enriquecido (Markdown/HTML sanitizado)
  shortDescription: string;      // Máximo 160 caracteres para cards y SEO

  // Medios
  coverImage: {
    url: string;
    alt: string;
    blurDataURL?: string;        // Para Next.js placeholder blur
    width: number;
    height: number;
  };
  gallery?: Array<{
    url: string;
    alt: string;
    caption?: string;
  }>;

  // Financiero
  targetAmount: number;          // Meta en CLP (e.g., 500000)
  raisedAmount: number;          // Total recaudado en CLP (actualizado por webhook)
  donorCount: number;            // Número de donantes únicos (desnormalizado)
  progressPercentage: number;    // (raisedAmount / targetAmount) * 100 — calculado

  // Estado y fechas
  status: DreamStatus;
  deadline?: Date;               // Fecha límite de la campaña (opcional)
  completedAt?: Date;            // Fecha en que se cumplió el sueño

  // Metadata SEO
  slug: string;                  // URL-friendly: "sueno-sofia-pintora"
  metaTitle?: string;
  metaDescription?: string;

  // Relaciones (opcionales: no siempre se cargan con los datos del dream)
  donations?: Donation[];
  category?: string;             // e.g., "arte", "educacion", "salud", "deporte"
  tags: string[];
}

/**
 * DONATION — Transacción individual de donación
 * Tabla pivote entre Contributor y Dream
 * Equivale a la tabla `donations` en PostgreSQL
 */
export interface Donation {
  id: string;                    // UUID v4
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  contributorId: string;         // FK → Contributor.id
  contributor: Contributor;
  dreamId: string;               // FK → Dream.id
  dream: Dream;

  // Monto y moneda
  amount: number;                // Monto en la moneda de la transacción
  currency: "CLP" | "USD" | "EUR"; // ISO 4217
  amountInCLP: number;           // Monto normalizado a CLP (para métricas)
  exchangeRate?: number;         // Tasa de cambio si no es CLP

  // Pago
  gateway: PaymentGateway;
  gatewayTransactionId: string;  // ID externo del gateway (para reconciliación)
  gatewayOrderId?: string;       // Orden interna del gateway
  status: DonationStatus;

  // Recibo y fiscalía
  receiptNumber?: string;        // Número de boleta/recibo
  receiptUrl?: string;           // URL al PDF del recibo
  taxDeductible: boolean;        // Si aplica deducción tributaria (Art. 69 Ley Renta)

  // Mensaje y visibilidad
  message?: string;              // Mensaje opcional del donante (máx 500 chars)
  isPublic: boolean;             // Si aparece en el muro de donantes
  displayName?: string;          // Nombre a mostrar (puede diferir del nombre real)

  // Metadata del pago
  paymentMethod?: string;        // e.g., "Crédito Visa", "Débito Redcompra"
  installments?: number;         // Cuotas (para tarjetas nacionales)
  ipAddress?: string;            // Para auditoría de seguridad (hasheado)
  userAgent?: string;            // Para detección de fraude

  // Webhooks
  webhookReceivedAt?: Date;      // Timestamp de recepción del webhook
  webhookPayload?: Record<string, unknown>; // Payload raw del gateway (para auditoría)
}

// ── TIENDA SOLIDARIA ─────────────────────────────────────────────────────────

/**
 * PRODUCT — Producto de la tienda solidaria
 */
export interface Product {
  id: string;                    // UUID v4
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // Información del producto
  name: string;                  // e.g., "Delantal Antimanchas Creativo"
  slug: string;                  // URL-friendly
  description: string;           // Descripción completa
  shortDescription: string;      // Para cards (máx 120 chars)
  category: ProductCategory;
  tags: string[];

  // Precio (siempre en CLP)
  price: number;                 // Precio en CLP
  compareAtPrice?: number;       // Precio anterior (para mostrar descuento)
  costPerItem?: number;          // Costo (privado — no exponer al cliente)

  // Inventario
  sku: string;                   // Código único de producto
  stock: number;                 // Unidades disponibles
  trackInventory: boolean;

  // Medios
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;

  // Variantes (tallas, colores)
  variants?: ProductVariant[];

  // Impacto social
  impactDescription: string;     // e.g., "100% va directo a los niños"
  relatedDreamId?: string;       // FK → Dream.id (qué sueño financia)

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;                  // e.g., "Talla S - Azul"
  sku: string;
  price?: number;                // Sobreescribe el precio base si aplica
  stock: number;
  attributes: Record<string, string>; // { talla: "S", color: "Azul" }
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ── COLABORADORES / ECOSISTEMA ───────────────────────────────────────────────

/**
 * COLLABORATOR — Profesional, artista o voluntario del ecosistema
 */
export interface Collaborator {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Identidad
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  rut?: string;

  // Tipo y perfil profesional
  type: CollaboratorType;
  profession?: string;           // e.g., "Psicóloga Clínica", "Artista Visual"
  specializations: string[];     // e.g., ["arteterapia", "psicología infantil"]
  bio?: string;                  // Descripción breve
  linkedInUrl?: string;
  portfolioUrl?: string;

  // Disponibilidad (para voluntarios/artistas)
  availability?: {
    hoursPerWeek: number;
    preferredSchedule: "morning" | "afternoon" | "evening" | "flexible";
    startDate?: Date;
  };

  // Verificación y estado
  isVerified: boolean;           // Validado por el equipo de la fundación
  backgroundCheckComplete: boolean;
  status: "pending" | "active" | "inactive" | "rejected";

  // Para voluntarios
  skills?: string[];             // ["diseño gráfico", "música", "carpintería"]
  languages?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// ── DTOs (Data Transfer Objects) ─────────────────────────────────────────────

/** DTO para crear una nueva donación (entrada del formulario) */
export interface CreateDonationDTO {
  dreamId: string;
  amount: number;                // En CLP (Webpay/Flow) o USD (PayPal)
  currency: "CLP" | "USD";
  gateway: PaymentGateway;
  contributor: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    rut?: string;
    isAnonymous: boolean;
    newsletterConsent: boolean;
  };
  message?: string;
  isPublic: boolean;
}

/** Respuesta de inicialización de pago (retorna URL de redirección) */
export interface PaymentInitResponse {
  donationId: string;
  redirectUrl: string;           // URL del gateway de pago
  token?: string;                // Token de la transacción (Webpay)
  expiresAt: Date;
}

/** Payload del webhook de confirmación de pago */
export interface PaymentWebhookPayload {
  gateway: PaymentGateway;
  transactionId: string;
  orderId: string;
  status: "approved" | "rejected" | "pending" | "refunded";
  amount: number;
  currency: string;
  timestamp: string;
  signature: string;             // HMAC-SHA256 para validar autenticidad
  metadata?: Record<string, unknown>;
}

// ── RESPUESTAS DE API ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export type PaginatedResponse<T> = ApiResponse<T[]>;
