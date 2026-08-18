-- ═══════════════════════════════════════════════════════════════════════════
--  XUBOOK — FUNDACIÓN SOCIAL NIÑOS CREATIVOS
--  Esquema de Base de Datos PostgreSQL 16+
--  Autor: Arquitectura Xubook — 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Hashing y cifrado
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Búsqueda sin tildes

-- ── ENUMERACIONES ────────────────────────────────────────────────────────────

CREATE TYPE dream_status AS ENUM (
  'draft', 'active', 'funded', 'completed', 'paused', 'cancelled'
);

CREATE TYPE donation_status AS ENUM (
  'pending', 'confirmed', 'failed', 'refunded', 'disputed'
);

CREATE TYPE payment_gateway AS ENUM (
  'webpay_plus',  -- Transbank Webpay Plus — tarjetas nacionales CLP
  'flow',         -- Flow.cl — múltiples medios nacionales CLP
  'paypal'        -- PayPal — donaciones internacionales USD
);

CREATE TYPE currency_code AS ENUM (
  'CLP', 'USD', 'EUR'
);

CREATE TYPE collaborator_type AS ENUM (
  'psychologist', 'therapist', 'social_worker', 'artist', 'volunteer'
);

CREATE TYPE collaborator_status AS ENUM (
  'pending', 'active', 'inactive', 'rejected'
);

CREATE TYPE product_category AS ENUM (
  'ropa_organica', 'delantales', 'pantalones', 'accesorios', 'kits'
);

-- ── TABLA: contributors ──────────────────────────────────────────────────────
-- Personas que donan o interactúan con la plataforma

CREATE TABLE contributors (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  first_name          VARCHAR(100)  NOT NULL,
  last_name           VARCHAR(100)  NOT NULL,
  email               VARCHAR(255)  NOT NULL UNIQUE,
  phone               VARCHAR(20),
  -- RUT cifrado (dato sensible — Ley 19.628 Chile)
  rut_encrypted       TEXT,
  rut_hash            VARCHAR(64),  -- SHA-256 del RUT para búsquedas sin descifrar

  -- Dirección (JSONB para flexibilidad)
  address             JSONB,
  /*
    Estructura address:
    {
      "street": "Av. Providencia 1234",
      "city": "Santiago",
      "region": "Metropolitana",
      "country": "CL",
      "postal_code": "7500000"
    }
  */

  is_anonymous        BOOLEAN       NOT NULL DEFAULT FALSE,
  newsletter_consent  BOOLEAN       NOT NULL DEFAULT FALSE,
  consent_date        TIMESTAMPTZ,

  -- Métricas desnormalizadas (actualizadas por triggers)
  total_donated       BIGINT        NOT NULL DEFAULT 0, -- En CLP (sin decimales)
  donation_count      INTEGER       NOT NULL DEFAULT 0,

  -- Seguridad
  email_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login_at       TIMESTAMPTZ,
  ip_address_hash     VARCHAR(64)   -- Hash de la IP de registro
);

-- Índices
CREATE INDEX idx_contributors_email      ON contributors(email);
CREATE INDEX idx_contributors_rut_hash   ON contributors(rut_hash) WHERE rut_hash IS NOT NULL;
CREATE INDEX idx_contributors_created_at ON contributors(created_at DESC);

-- ── TABLA: dreams ────────────────────────────────────────────────────────────
-- Cada campaña de crowdfunding representa el sueño de un niño/a

CREATE TABLE dreams (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id           VARCHAR(20)   NOT NULL UNIQUE, -- 'SUEÑO-0001'
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,

  title               VARCHAR(200)  NOT NULL,
  child_name          VARCHAR(100)  NOT NULL,
  child_age           SMALLINT      NOT NULL CHECK (child_age BETWEEN 0 AND 17),
  story               TEXT          NOT NULL,        -- HTML sanitizado / Markdown
  short_description   VARCHAR(160)  NOT NULL,

  -- Medios (JSONB para flexibilidad)
  cover_image         JSONB         NOT NULL,
  /*
    { "url": "...", "alt": "...", "blur_data_url": "...", "width": 1200, "height": 630 }
  */
  gallery             JSONB,                         -- Array de imágenes

  -- Financiero (en CLP, sin decimales)
  target_amount       BIGINT        NOT NULL CHECK (target_amount > 0),
  raised_amount       BIGINT        NOT NULL DEFAULT 0,
  donor_count         INTEGER       NOT NULL DEFAULT 0,
  -- Calculado como (raised_amount * 100 / target_amount)
  progress_pct        NUMERIC(5,2)  GENERATED ALWAYS AS
                        (ROUND((raised_amount::NUMERIC / NULLIF(target_amount, 0)) * 100, 2))
                      STORED,

  status              dream_status  NOT NULL DEFAULT 'draft',
  deadline            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  -- SEO
  slug                VARCHAR(250)  NOT NULL UNIQUE,
  meta_title          VARCHAR(60),
  meta_description    VARCHAR(160),

  -- Clasificación
  category            VARCHAR(50),
  tags                TEXT[]        NOT NULL DEFAULT '{}',

  -- Restricción de integridad
  CONSTRAINT check_raised_lte_target CHECK (
    status = 'funded' OR raised_amount <= target_amount * 1.1  -- Permite 10% overflow
  )
);

-- Índices
CREATE INDEX idx_dreams_status       ON dreams(status) WHERE status = 'active';
CREATE INDEX idx_dreams_slug         ON dreams(slug);
CREATE INDEX idx_dreams_public_id    ON dreams(public_id);
CREATE INDEX idx_dreams_published_at ON dreams(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_dreams_tags         ON dreams USING GIN(tags);

-- Función para auto-generar public_id secuencial
CREATE SEQUENCE dream_public_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_dream_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL OR NEW.public_id = '' THEN
    NEW.public_id := 'SUEÑO-' || LPAD(nextval('dream_public_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dreams_public_id
  BEFORE INSERT ON dreams
  FOR EACH ROW EXECUTE FUNCTION generate_dream_public_id();

-- ── TABLA: donations ────────────────────────────────────────────────────────
-- Tabla pivote: vincula Contributor ↔ Dream con los detalles de la transacción

CREATE TABLE donations (
  id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- Relaciones (FK con índices)
  contributor_id          UUID            NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
  dream_id                UUID            NOT NULL REFERENCES dreams(id)       ON DELETE RESTRICT,

  -- Monto
  amount                  BIGINT          NOT NULL CHECK (amount > 0), -- En moneda original
  currency                currency_code   NOT NULL DEFAULT 'CLP',
  amount_in_clp           BIGINT          NOT NULL CHECK (amount_in_clp > 0),
  exchange_rate           NUMERIC(10, 6)  DEFAULT 1.000000,

  -- Pago
  gateway                 payment_gateway NOT NULL,
  gateway_transaction_id  VARCHAR(200)    NOT NULL,
  gateway_order_id        VARCHAR(200),
  status                  donation_status NOT NULL DEFAULT 'pending',

  -- Recibo fiscal
  receipt_number          VARCHAR(50)     UNIQUE,
  receipt_url             TEXT,
  tax_deductible          BOOLEAN         NOT NULL DEFAULT TRUE,

  -- Visibilidad pública
  message                 VARCHAR(500),
  is_public               BOOLEAN         NOT NULL DEFAULT TRUE,
  display_name            VARCHAR(100),    -- Nombre a mostrar (e.g., "María A.")

  -- Metadata de pago
  payment_method          VARCHAR(100),
  installments            SMALLINT        DEFAULT 1,
  ip_address_hash         VARCHAR(64),
  user_agent_hash         VARCHAR(64),

  -- Webhook
  webhook_received_at     TIMESTAMPTZ,
  webhook_payload         JSONB,

  -- Constraint de unicidad del gateway
  UNIQUE (gateway, gateway_transaction_id)
);

-- Índices
CREATE INDEX idx_donations_contributor  ON donations(contributor_id);
CREATE INDEX idx_donations_dream        ON donations(dream_id);
CREATE INDEX idx_donations_status       ON donations(status);
CREATE INDEX idx_donations_gateway      ON donations(gateway, gateway_transaction_id);
CREATE INDEX idx_donations_created_at   ON donations(created_at DESC);
CREATE INDEX idx_donations_public       ON donations(dream_id, is_public) WHERE is_public = TRUE;

-- ── TRIGGERS: mantener raised_amount y donor_count actualizados ──────────────

CREATE OR REPLACE FUNCTION update_dream_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_dream_id UUID;
  v_new_raised BIGINT;
  v_new_donor_count INTEGER;
BEGIN
  -- Determinar qué dream_id se afectó
  IF TG_OP = 'DELETE' THEN
    v_dream_id := OLD.dream_id;
  ELSE
    v_dream_id := NEW.dream_id;
  END IF;

  -- Recalcular totales desde 0 (evita race conditions)
  SELECT
    COALESCE(SUM(amount_in_clp), 0),
    COUNT(DISTINCT contributor_id)
  INTO v_new_raised, v_new_donor_count
  FROM donations
  WHERE dream_id = v_dream_id
    AND status = 'confirmed';

  UPDATE dreams
  SET
    raised_amount = v_new_raised,
    donor_count   = v_new_donor_count,
    updated_at    = NOW(),
    -- Auto-marcar como funded si se alcanzó la meta
    status = CASE
      WHEN v_new_raised >= target_amount AND status = 'active' THEN 'funded'
      ELSE status
    END
  WHERE id = v_dream_id;

  -- Actualizar métricas del contribuyente
  UPDATE contributors
  SET
    total_donated  = (SELECT COALESCE(SUM(amount_in_clp), 0) FROM donations WHERE contributor_id = NEW.contributor_id AND status = 'confirmed'),
    donation_count = (SELECT COUNT(*) FROM donations WHERE contributor_id = NEW.contributor_id AND status = 'confirmed'),
    updated_at     = NOW()
  WHERE id = NEW.contributor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_dream_stats
  AFTER INSERT OR UPDATE OF status ON donations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' OR OLD.status = 'confirmed')
  EXECUTE FUNCTION update_dream_stats();

-- ── TABLA: products ─────────────────────────────────────────────────────────

CREATE TABLE products (
  id                  UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,

  name                VARCHAR(200)      NOT NULL,
  slug                VARCHAR(250)      NOT NULL UNIQUE,
  description         TEXT              NOT NULL,
  short_description   VARCHAR(120)      NOT NULL,
  category            product_category  NOT NULL,
  tags                TEXT[]            DEFAULT '{}',

  price               INTEGER           NOT NULL CHECK (price > 0),   -- CLP
  compare_at_price    INTEGER           CHECK (compare_at_price > price),
  cost_per_item       INTEGER,

  sku                 VARCHAR(100)      NOT NULL UNIQUE,
  stock               INTEGER           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  track_inventory     BOOLEAN           NOT NULL DEFAULT TRUE,

  images              JSONB             NOT NULL DEFAULT '[]',
  impact_description  TEXT              NOT NULL,
  related_dream_id    UUID              REFERENCES dreams(id) ON DELETE SET NULL,

  meta_title          VARCHAR(60),
  meta_description    VARCHAR(160),
  is_active           BOOLEAN           NOT NULL DEFAULT TRUE,
  is_featured         BOOLEAN           NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_products_slug     ON products(slug);
CREATE INDEX idx_products_active   ON products(is_active, is_featured);
CREATE INDEX idx_products_category ON products(category) WHERE is_active = TRUE;

-- ── TABLA: collaborators ─────────────────────────────────────────────────────

CREATE TABLE collaborators (
  id                        UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  first_name                VARCHAR(100)          NOT NULL,
  last_name                 VARCHAR(100)          NOT NULL,
  email                     VARCHAR(255)          NOT NULL UNIQUE,
  phone                     VARCHAR(20),
  rut_encrypted             TEXT,
  rut_hash                  VARCHAR(64),

  type                      collaborator_type     NOT NULL,
  profession                VARCHAR(150),
  specializations           TEXT[]                DEFAULT '{}',
  bio                       TEXT,
  linkedin_url              TEXT,
  portfolio_url             TEXT,

  -- Disponibilidad (JSONB)
  availability              JSONB,

  is_verified               BOOLEAN               NOT NULL DEFAULT FALSE,
  background_check_complete BOOLEAN               NOT NULL DEFAULT FALSE,
  status                    collaborator_status   NOT NULL DEFAULT 'pending',

  skills                    TEXT[]                DEFAULT '{}',
  languages                 TEXT[]                DEFAULT '{"es"}',
  emergency_contact         JSONB
);

CREATE INDEX idx_collaborators_type   ON collaborators(type, status);
CREATE INDEX idx_collaborators_status ON collaborators(status);

-- ── FUNCIÓN: updated_at automático ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['contributors','dreams','donations','products','collaborators']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ── VISTAS ANALÍTICAS ────────────────────────────────────────────────────────

-- Vista resumen de campañas activas (usada por la API para cards)
CREATE OR REPLACE VIEW v_active_dreams AS
SELECT
  d.id,
  d.public_id,
  d.title,
  d.child_name,
  d.short_description,
  d.cover_image,
  d.target_amount,
  d.raised_amount,
  d.progress_pct,
  d.donor_count,
  d.deadline,
  d.status,
  d.slug,
  d.category,
  d.tags
FROM dreams d
WHERE d.status = 'active'
ORDER BY d.published_at DESC;

-- Vista de top donantes públicos (para muro de donantes)
CREATE OR REPLACE VIEW v_top_donors AS
SELECT
  c.id,
  CASE c.is_anonymous
    WHEN TRUE  THEN 'Donante Anónimo'
    ELSE c.first_name || ' ' || LEFT(c.last_name, 1) || '.'
  END AS display_name,
  c.total_donated,
  c.donation_count
FROM contributors c
WHERE c.donation_count > 0
ORDER BY c.total_donated DESC
LIMIT 50;

-- ── DATOS SEMILLA (SEED) ─────────────────────────────────────────────────────

-- Sueño ejemplo #0001
INSERT INTO dreams (
  title, child_name, child_age, story, short_description,
  cover_image, target_amount, status, slug, category, tags, published_at
) VALUES (
  'El sueño de Valentina: Clases de pintura',
  'Valentina',
  7,
  '<p>Valentina tiene 7 años y un corazón lleno de colores. Cada vez que ve una hoja en blanco, sus ojos brillan. Necesita materiales de pintura y clases para desarrollar su talento innato...</p>',
  'Valentina sueña con aprender a pintar y expresar todo lo que lleva en su corazón.',
  '{"url": "/images/suenos/valentina-cover.jpg", "alt": "Valentina sonriendo con pinturas", "width": 1200, "height": 630}',
  150000,  -- CLP $150.000
  'active',
  'sueno-valentina-clases-pintura',
  'arte',
  ARRAY['pintura','arte','creatividad','niña'],
  NOW()
);

COMMENT ON TABLE dreams     IS 'Campañas de crowdfunding — un sueño por niño/a';
COMMENT ON TABLE donations  IS 'Transacciones de donación — tabla pivote Contributor ↔ Dream';
COMMENT ON TABLE contributors IS 'Personas donantes o registradas en la plataforma';
COMMENT ON TABLE collaborators IS 'Profesionales, artistas y voluntarios del ecosistema';
COMMENT ON TABLE products   IS 'Productos de la tienda solidaria Xubook';
