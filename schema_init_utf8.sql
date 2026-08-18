-- CreateEnum
CREATE TYPE "dream_status" AS ENUM ('draft', 'active', 'funded', 'completed', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "donation_status" AS ENUM ('pending', 'confirmed', 'failed', 'refunded', 'disputed');

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('webpay_plus', 'flow', 'paypal');

-- CreateEnum
CREATE TYPE "currency_code" AS ENUM ('CLP', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "collaborator_type" AS ENUM ('psychologist', 'therapist', 'social_worker', 'artist', 'volunteer');

-- CreateEnum
CREATE TYPE "collaborator_status" AS ENUM ('pending', 'active', 'inactive', 'rejected');

-- CreateEnum
CREATE TYPE "product_category" AS ENUM ('ropa_organica', 'delantales', 'pantalones', 'accesorios', 'kits');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateTable
CREATE TABLE "contributors" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "rut_encrypted" TEXT,
    "rut_hash" VARCHAR(64),
    "address" JSONB,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "newsletter_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMPTZ,
    "total_donated" BIGINT NOT NULL DEFAULT 0,
    "donation_count" INTEGER NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "ip_address_hash" VARCHAR(64),

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dreams" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "published_at" TIMESTAMPTZ,
    "title" VARCHAR(200) NOT NULL,
    "child_name" VARCHAR(100) NOT NULL,
    "child_age" SMALLINT NOT NULL,
    "story" TEXT NOT NULL,
    "short_description" VARCHAR(160) NOT NULL,
    "cover_image" JSONB NOT NULL,
    "gallery" JSONB,
    "target_amount" BIGINT NOT NULL DEFAULT 0,
    "raised_amount" BIGINT NOT NULL DEFAULT 0,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "dream_status" NOT NULL DEFAULT 'draft',
    "deadline" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "slug" VARCHAR(250) NOT NULL,
    "meta_title" VARCHAR(60),
    "meta_description" VARCHAR(160),
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "dreams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "contributor_id" UUID NOT NULL,
    "dream_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "currency_code" NOT NULL DEFAULT 'CLP',
    "amount_in_clp" BIGINT NOT NULL,
    "exchange_rate" DECIMAL(10,6),
    "gateway" "payment_gateway" NOT NULL,
    "gateway_transaction_id" VARCHAR(200) NOT NULL,
    "gateway_order_id" VARCHAR(200),
    "status" "donation_status" NOT NULL DEFAULT 'pending',
    "receipt_number" VARCHAR(50),
    "receipt_url" TEXT,
    "tax_deductible" BOOLEAN NOT NULL DEFAULT true,
    "message" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "display_name" VARCHAR(100),
    "payment_method" VARCHAR(100),
    "installments" INTEGER DEFAULT 1,
    "ip_address_hash" VARCHAR(64),
    "user_agent_hash" VARCHAR(64),
    "webhook_received_at" TIMESTAMPTZ,
    "webhook_payload" JSONB,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "published_at" TIMESTAMPTZ,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" VARCHAR(120) NOT NULL,
    "category" "product_category" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" INTEGER NOT NULL,
    "compare_at_price" INTEGER,
    "cost_per_item" INTEGER,
    "sku" VARCHAR(100) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "track_inventory" BOOLEAN NOT NULL DEFAULT true,
    "images" JSONB NOT NULL,
    "impact_description" TEXT NOT NULL,
    "related_dream_id" UUID,
    "meta_title" VARCHAR(60),
    "meta_description" VARCHAR(160),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "price" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "contributor_id" UUID NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "subtotal" INTEGER NOT NULL,
    "shipping_cost" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "shipping_address" JSONB NOT NULL,
    "gateway" VARCHAR(50),
    "gateway_transaction_id" VARCHAR(200),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborators" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "rut_encrypted" TEXT,
    "rut_hash" VARCHAR(64),
    "type" "collaborator_type" NOT NULL,
    "profession" VARCHAR(150),
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "linkedin_url" TEXT,
    "portfolio_url" TEXT,
    "availability" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "background_check_complete" BOOLEAN NOT NULL DEFAULT false,
    "status" "collaborator_status" NOT NULL DEFAULT 'pending',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY['es']::TEXT[],
    "emergency_contact" JSONB,

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contributors_email_key" ON "contributors"("email");

-- CreateIndex
CREATE INDEX "contributors_email_idx" ON "contributors"("email");

-- CreateIndex
CREATE INDEX "contributors_rut_hash_idx" ON "contributors"("rut_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dreams_public_id_key" ON "dreams"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "dreams_slug_key" ON "dreams"("slug");

-- CreateIndex
CREATE INDEX "dreams_status_idx" ON "dreams"("status");

-- CreateIndex
CREATE INDEX "dreams_slug_idx" ON "dreams"("slug");

-- CreateIndex
CREATE INDEX "dreams_published_at_idx" ON "dreams"("published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "donations_receipt_number_key" ON "donations"("receipt_number");

-- CreateIndex
CREATE INDEX "donations_contributor_id_idx" ON "donations"("contributor_id");

-- CreateIndex
CREATE INDEX "donations_dream_id_idx" ON "donations"("dream_id");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_created_at_idx" ON "donations"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "donations_gateway_gateway_transaction_id_key" ON "donations"("gateway", "gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_is_active_is_featured_idx" ON "products"("is_active", "is_featured");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");

-- CreateIndex
CREATE INDEX "orders_contributor_id_idx" ON "orders"("contributor_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_email_key" ON "collaborators"("email");

-- CreateIndex
CREATE INDEX "collaborators_type_status_idx" ON "collaborators"("type", "status");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_dream_id_fkey" FOREIGN KEY ("dream_id") REFERENCES "dreams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_related_dream_id_fkey" FOREIGN KEY ("related_dream_id") REFERENCES "dreams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

