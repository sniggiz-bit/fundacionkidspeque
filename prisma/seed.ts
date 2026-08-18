/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────────
 * Datos de prueba para desarrollo local.
 * Corre con: npx prisma db seed
 *
 * Inserta:
 *   - 5 sueños (3 activos, 1 financiado, 1 borrador)
 *   - 6 donantes
 *   - 12 donaciones confirmadas
 *   - 4 productos de tienda
 *   - 3 colaboradores (2 activos, 1 pendiente)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Limpiando datos anteriores…");

  // Limpiar en orden inverso (respetar FK)
  await prisma.donation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.dream.deleteMany();
  await prisma.contributor.deleteMany();
  await prisma.collaborator.deleteMany();

  // ── 1. COLABORADORES ──────────────────────────────────────────────
  console.log("👥  Creando colaboradores…");

  await prisma.collaborator.createMany({
    data: [
      {
        firstName: "Catalina",
        lastName:  "Morales",
        email:     "catalina.morales@example.com",
        phone:     "+56912345678",
        type:      "psychologist",
        profession: "Psicóloga Infantil",
        specializations: ["arteterapia", "psicología del desarrollo"],
        bio:       "Más de 8 años acompañando a niños y familias en su desarrollo emocional a través de la creatividad.",
        isVerified: true,
        backgroundCheckComplete: true,
        status:    "active",
        skills:    ["terapia de juego", "evaluación psicológica"],
        languages: ["es", "en"],
      },
      {
        firstName: "Rodrigo",
        lastName:  "Vargas",
        email:     "rodrigo.vargas@example.com",
        phone:     "+56987654321",
        type:      "artist",
        profession: "Artista Visual",
        specializations: ["pintura", "muralismo", "talleres creativos"],
        bio:       "Artista visual con pasión por enseñar a los niños a expresarse a través del arte.",
        isVerified: true,
        backgroundCheckComplete: true,
        status:    "active",
        skills:    ["pintura acrílica", "acuarela", "collage"],
        languages: ["es"],
      },
      {
        firstName: "Sofía",
        lastName:  "Reyes",
        email:     "sofia.reyes@example.com",
        type:      "volunteer",
        profession: "Educadora de Párvulos",
        specializations: ["educación inicial", "metodología Montessori"],
        bio:       "Me encanta trabajar con niños pequeños y ayudarlos a descubrir el mundo.",
        isVerified: false,
        backgroundCheckComplete: false,
        status:    "pending",
        skills:    ["pedagogía", "música", "teatro infantil"],
        languages: ["es"],
      },
    ],
  });

  // ── 2. SUEÑOS ────────────────────────────────────────────────────
  console.log("✨  Creando sueños…");

  const [dream1, dream2, dream3, dream4, dream5] = await Promise.all([
    prisma.dream.create({
      data: {
        publicId:        "DRM-VAL01",
        title:           "El sueño de Valentina: Aprender a pintar",
        childName:       "Valentina",
        childAge:        7,
        shortDescription: "Valentina tiene 7 años y sueña con expresar sus emociones a través de la pintura.",
        story: `<p>Valentina tiene 7 años y vive con su mamá y abuela en la población La Victoria. Desde pequeña, llena cualquier papel que encuentra con dibujos llenos de color y vida.</p>
<p>Su sueño es tomar clases de pintura y tener sus propios materiales. Con tu ayuda, Valentina podrá desarrollar su talento y encontrar en el arte un espacio seguro de expresión.</p>
<p><strong>¿Qué necesitamos?</strong></p>
<ul>
  <li>Kit completo de pinturas acrílicas y pinceles</li>
  <li>6 meses de clases de arte (1 vez por semana)</li>
  <li>Lienzos y materiales de soporte</li>
</ul>`,
        coverImage:      { url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format", alt: "Valentina sonriendo con pinturas", width: 800, height: 600 },
        targetAmount:    BigInt(150000),
        raisedAmount:    BigInt(112500),
        donorCount:      34,
        progressPct:     75.0,
        status:          "active",
        deadline:        daysFromNow(12),
        publishedAt:     daysAgo(20),
        slug:            "sueno-valentina-pintura",
        category:        "arte",
        tags:            ["pintura", "arte", "niña", "creatividad"],
        metaTitle:       "El sueño de Valentina | Kidspeque",
        metaDescription: "Valentina tiene 7 años y sueña con aprender a pintar. Con tu ayuda podemos cumplir su sueño.",
      },
    }),
    prisma.dream.create({
      data: {
        publicId:        "DRM-MAT02",
        title:           "El sueño de Matías: Su primera bicicleta",
        childName:       "Matías",
        childAge:        9,
        shortDescription: "Matías camina 3 km diarios para ir al colegio. Una bicicleta cambiaría completamente su vida.",
        story: `<p>Matías tiene 9 años y cada mañana camina 3 kilómetros para llegar a su escuela en Pudahuel.</p>
<p>Una bicicleta le daría independencia, ahorraría tiempo y le abriría un mundo de posibilidades para explorar su barrio de manera segura.</p>`,
        coverImage:      { url: "https://images.unsplash.com/photo-1472746729193-54e3ee4a50c0?w=800&auto=format", alt: "Niño feliz al aire libre", width: 800, height: 600 },
        targetAmount:    BigInt(89000),
        raisedAmount:    BigInt(89000),
        donorCount:      47,
        progressPct:     100.0,
        status:          "funded",
        publishedAt:     daysAgo(45),
        completedAt:     daysAgo(5),
        slug:            "sueno-matias-bicicleta",
        category:        "deporte",
        tags:            ["bicicleta", "transporte", "niño"],
      },
    }),
    prisma.dream.create({
      data: {
        publicId:        "DRM-ISI03",
        title:           "El sueño de Isidora: Clases de música",
        childName:       "Isidora",
        childAge:        11,
        shortDescription: "Isidora sueña con aprender guitarra. Su familia no puede pagar las clases, pero su talento es enorme.",
        story: `<p>Isidora canta sola en su habitación desde que tiene memoria. A los 11 años, su voz ya emociona a toda la familia.</p>
<p>Con clases de guitarra, Isidora podría acompañar su voz y dar el primer paso hacia su sueño de ser músico.</p>`,
        coverImage:      { url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format", alt: "Niña con instrumento musical", width: 800, height: 600 },
        targetAmount:    BigInt(200000),
        raisedAmount:    BigInt(58000),
        donorCount:      19,
        progressPct:     29.0,
        status:          "active",
        deadline:        daysFromNow(25),
        publishedAt:     daysAgo(10),
        slug:            "sueno-isidora-musica",
        category:        "música",
        tags:            ["guitarra", "música", "niña"],
      },
    }),
    prisma.dream.create({
      data: {
        publicId:        "DRM-DIE04",
        title:           "El sueño de Diego: Kit de robótica",
        childName:       "Diego",
        childAge:        12,
        shortDescription: "Diego construye pequeños inventos con lo que encuentra. Un kit de robótica encendería su pasión.",
        story: `<p>Diego tiene 12 años y desmonta todo lo que encuentra para entender cómo funciona. Con cartones y cables viejos, ya construyó un pequeño brazo robótico.</p>
<p>Un kit de robótica profesional le permitiría aprender programación y electrónica de forma estructurada.</p>`,
        coverImage:      { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format", alt: "Niño trabajando con tecnología", width: 800, height: 600 },
        targetAmount:    BigInt(120000),
        raisedAmount:    BigInt(84000),
        donorCount:      28,
        progressPct:     70.0,
        status:          "active",
        deadline:        daysFromNow(5),
        publishedAt:     daysAgo(30),
        slug:            "sueno-diego-robotica",
        category:        "tecnología",
        tags:            ["robótica", "tecnología", "programación"],
      },
    }),
    prisma.dream.create({
      data: {
        publicId:        "DRM-CAM05",
        title:           "El sueño de Camila: Ser bailarina",
        childName:       "Camila",
        childAge:        8,
        shortDescription: "Camila baila en cada oportunidad. Sus zapatos de danza la acercarían a su mayor sueño.",
        story: `<p>Camila baila en el living, en el patio, en cualquier lugar donde suene música. Tiene 8 años y un talento natural que su profesora de kínder ya notó.</p>
<p>Con matrícula en una academia de danza y sus primeros zapatos de ballet, Camila daría el primer paso en su camino artístico.</p>`,
        coverImage:      { url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format", alt: "Niña bailando con alegría", width: 800, height: 600 },
        targetAmount:    BigInt(180000),
        raisedAmount:    BigInt(0),
        donorCount:      0,
        progressPct:     0.0,
        status:          "draft",
        slug:            "sueno-camila-bailarina",
        category:        "danza",
        tags:            ["danza", "ballet", "niña"],
      },
    }),
  ]);

  // ── 3. DONANTES ──────────────────────────────────────────────────
  console.log("🧑‍🤝‍🧑  Creando donantes…");

  const contributors = await Promise.all([
    prisma.contributor.create({ data: { firstName: "María", lastName: "González", email: "maria.gonzalez@example.com", phone: "+56911111111", isAnonymous: false, newsletterConsent: true, totalDonated: BigInt(50000), donationCount: 2, emailVerified: true } }),
    prisma.contributor.create({ data: { firstName: "Carlos", lastName: "Muñoz", email: "carlos.munoz@example.com", phone: "+56922222222", isAnonymous: false, newsletterConsent: false, totalDonated: BigInt(25000), donationCount: 1, emailVerified: true } }),
    prisma.contributor.create({ data: { firstName: "Ana", lastName: "Martínez", email: "ana.martinez@example.com", isAnonymous: true, newsletterConsent: false, totalDonated: BigInt(15000), donationCount: 1, emailVerified: false } }),
    prisma.contributor.create({ data: { firstName: "Pedro", lastName: "Soto", email: "pedro.soto@example.com", phone: "+56944444444", isAnonymous: false, newsletterConsent: true, totalDonated: BigInt(100000), donationCount: 3, emailVerified: true } }),
    prisma.contributor.create({ data: { firstName: "Lucía", lastName: "Fernández", email: "lucia.fernandez@example.com", isAnonymous: false, newsletterConsent: true, totalDonated: BigInt(30000), donationCount: 2, emailVerified: true } }),
    prisma.contributor.create({ data: { firstName: "Roberto", lastName: "Díaz", email: "roberto.diaz@example.com", isAnonymous: false, newsletterConsent: false, totalDonated: BigInt(45000), donationCount: 2, emailVerified: true } }),
  ]);

  // ── 4. DONACIONES ─────────────────────────────────────────────────
  console.log("💳  Creando donaciones…");

  const donationData = [
    // Sueño 1 — Valentina (75%)
    { contributorIdx: 0, dreamId: dream1.id, amount: BigInt(20000), amountInCLP: BigInt(20000), gateway: "webpay_plus" as const, method: "Crédito Visa", daysAgo: 15 },
    { contributorIdx: 3, dreamId: dream1.id, amount: BigInt(50000), amountInCLP: BigInt(50000), gateway: "flow" as const, method: "Débito Redcompra", daysAgo: 10 },
    { contributorIdx: 4, dreamId: dream1.id, amount: BigInt(25000), amountInCLP: BigInt(25000), gateway: "webpay_plus" as const, method: "Crédito Mastercard", daysAgo: 5 },
    { contributorIdx: 1, dreamId: dream1.id, amount: BigInt(17500), amountInCLP: BigInt(17500), gateway: "webpay_plus" as const, method: "Débito Redcompra", daysAgo: 2 },
    // Sueño 2 — Matías (100%)
    { contributorIdx: 3, dreamId: dream2.id, amount: BigInt(40000), amountInCLP: BigInt(40000), gateway: "webpay_plus" as const, method: "Crédito Visa", daysAgo: 40 },
    { contributorIdx: 5, dreamId: dream2.id, amount: BigInt(30000), amountInCLP: BigInt(30000), gateway: "flow" as const, method: "Débito Redcompra", daysAgo: 38 },
    { contributorIdx: 2, dreamId: dream2.id, amount: BigInt(19000), amountInCLP: BigInt(19000), gateway: "webpay_plus" as const, method: "Crédito Mastercard", daysAgo: 35 },
    // Sueño 3 — Isidora (29%)
    { contributorIdx: 0, dreamId: dream3.id, amount: BigInt(30000), amountInCLP: BigInt(30000), gateway: "webpay_plus" as const, method: "Crédito Visa", daysAgo: 8 },
    { contributorIdx: 4, dreamId: dream3.id, amount: BigInt(28000), amountInCLP: BigInt(28000), gateway: "flow" as const, method: "Débito Redcompra", daysAgo: 4 },
    // Sueño 4 — Diego (70%)
    { contributorIdx: 3, dreamId: dream4.id, amount: BigInt(50000), amountInCLP: BigInt(50000), gateway: "webpay_plus" as const, method: "Crédito Visa", daysAgo: 25 },
    { contributorIdx: 5, dreamId: dream4.id, amount: BigInt(20000), amountInCLP: BigInt(20000), gateway: "webpay_plus" as const, method: "Débito Redcompra", daysAgo: 20 },
    { contributorIdx: 1, dreamId: dream4.id, amount: BigInt(14000), amountInCLP: BigInt(14000), gateway: "flow" as const, method: "Prepago", daysAgo: 18 },
  ];

  for (let i = 0; i < donationData.length; i++) {
    const d = donationData[i];
    const createdAt = daysAgo(d.daysAgo);
    await prisma.donation.create({
      data: {
        contributorId:       contributors[d.contributorIdx].id,
        dreamId:             d.dreamId,
        amount:              d.amount,
        currency:            "CLP",
        amountInCLP:         d.amountInCLP,
        gateway:             d.gateway,
        gatewayTransactionId: `TEST-${Date.now()}-${i}`,
        status:              "confirmed",
        receiptNumber:       `RCP-2024-${String(i + 1).padStart(4, "0")}`,
        taxDeductible:       true,
        isPublic:            true,
        paymentMethod:       d.method,
        installments:        1,
        webhookReceivedAt:   createdAt,
        createdAt,
        updatedAt:           createdAt,
      },
    });
  }

  // ── 5. PRODUCTOS ─────────────────────────────────────────────────
  console.log("🛍️  Creando productos…");

  await prisma.product.createMany({
    data: [
      {
        name:             "Delantal Antimanchas Creativo",
        slug:             "delantal-antimanchas-creativo",
        description:      "El delantal perfecto para que los pequeños artistas puedan pintar, dibujar y crear sin preocupaciones. Confeccionado con tela impermeable de alta resistencia.",
        shortDescription: "Delantal resistente a manchas para niños creativos de 2 a 12 años.",
        category:         "delantales",
        tags:             ["delantal", "arte", "manualidades", "impermeable"],
        price:            14990,
        compareAtPrice:   19990,
        sku:              "DEL-001",
        stock:            45,
        trackInventory:   true,
        images:           [{ url: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format", alt: "Delantal colorido para niños", width: 800, height: 800 }],
        impactDescription: "El 30% de cada venta se destina directamente a financiar materiales de arte para niños en vulnerabilidad.",
        isActive:         true,
        isFeatured:       true,
        publishedAt:      daysAgo(60),
      },
      {
        name:             "Pantalón de Juego Orgánico",
        slug:             "pantalon-juego-organico",
        description:      "Pantalón de algodón orgánico certificado GOTS. Elástico, cómodo y resistente a las aventuras del día a día. Ideal para el jardín, la escuela y los juegos al aire libre.",
        shortDescription: "Pantalón de algodón orgánico, cómodo y resistente para la vida activa.",
        category:         "pantalones",
        tags:             ["pantalón", "orgánico", "algodón", "GOTS"],
        price:            22990,
        sku:              "PAN-001",
        stock:            32,
        trackInventory:   true,
        images:           [{ url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format", alt: "Pantalón para niños", width: 800, height: 800 }],
        impactDescription: "Cada prenda es confeccionada por madres de familias beneficiarias de la fundación, generando trabajo digno.",
        isActive:         true,
        isFeatured:       false,
        publishedAt:      daysAgo(45),
      },
      {
        name:             "Kit Creativo Completo",
        slug:             "kit-creativo-completo",
        description:      "El regalo perfecto para despertar la creatividad. Incluye pinturas acrílicas, pinceles, block de dibujo, plastilina y guía de actividades creativas para niños.",
        shortDescription: "Todo lo que un niño creativo necesita en un solo kit.",
        category:         "kits",
        tags:             ["kit", "creativo", "regalo", "pinturas", "manualidades"],
        price:            34990,
        compareAtPrice:   44990,
        sku:              "KIT-001",
        stock:            18,
        trackInventory:   true,
        images:           [{ url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format", alt: "Kit de materiales creativos", width: 800, height: 800 }],
        impactDescription: "Con cada kit vendido, donamos un kit idéntico a un niño de la fundación que no puede comprarlo.",
        isActive:         true,
        isFeatured:       true,
        publishedAt:      daysAgo(30),
      },
      {
        name:             "Mochila Reciclada Kidspeque",
        slug:             "mochila-reciclada-kidspeque",
        description:      "Mochila confeccionada con materiales reciclados de alta calidad. Diseñada por artistas colaboradores de la fundación con motivos coloridos e inspiradores.",
        shortDescription: "Mochila con diseño de artistas de la fundación, fabricada con materiales reciclados.",
        category:         "accesorios",
        tags:             ["mochila", "reciclado", "sostenible", "diseño"],
        price:            28990,
        sku:              "ACC-001",
        stock:            0,
        trackInventory:   true,
        images:           [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format", alt: "Mochila colorida con diseño artístico", width: 800, height: 800 }],
        impactDescription: "Cada mochila vendida financia un mes de clases de arte para un niño de la fundación.",
        isActive:         true,
        isFeatured:       false,
        publishedAt:      daysAgo(15),
      },
    ],
  });

  // ── Resumen ──────────────────────────────────────────────────────
  const counts = {
    collaborators: await prisma.collaborator.count(),
    dreams:        await prisma.dream.count(),
    contributors:  await prisma.contributor.count(),
    donations:     await prisma.donation.count(),
    products:      await prisma.product.count(),
  };

  console.log("\n✅  Seed completado:");
  console.log(`   👥  Colaboradores: ${counts.collaborators}`);
  console.log(`   ✨  Sueños:        ${counts.dreams}`);
  console.log(`   🧑  Donantes:      ${counts.contributors}`);
  console.log(`   💳  Donaciones:    ${counts.donations}`);
  console.log(`   🛍️  Productos:     ${counts.products}`);
  console.log("\n🔑  Panel admin:");
  console.log("   URL:      http://localhost:3000/admin/login");
  console.log("   Password: admin123\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
