import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.rentalDetail.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productCustomizationOption.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');

  // Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const staffPasswordHash = await bcrypt.hash('staff123', salt);
  const customerPasswordHash = await bcrypt.hash('customer123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Owner',
      phoneNumber: '03001234567',
      email: 'admin@bazar.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Gwadar Tailoring Lead',
      phoneNumber: '03007654321',
      email: 'staff@bazar.com',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Zainab Baluch',
      phoneNumber: '03219998887',
      email: 'zainab@gmail.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
    },
  });

  console.log('Users created.');

  // Create Address
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      sectorName: 'Mulla Band',
      streetAddress: 'Main Bazar Street, Near Al-Noor Masjid',
      landmark: 'Gwadar Port Gate 2',
      isDefault: true,
    },
  });

  console.log('Address seeded.');

  // --- Seed 22 Unique Products Mapped to the 22 Local Images ---

  // 1. Royal Red Complete Balochi Set (75d79d6b70bdd2a4c2fb90ae21faa29d.png)
  const p1 = await prisma.product.create({
    data: {
      name: 'Royal Red Complete Balochi Set',
      description: 'Stately complete Balochi cultural suit featuring broad hand-embroidered details on the neck and cuffs.',
      category: 'Complete Balochi Sets',
      basePrice: 22000.0,
      stockQuantity: 5,
      isRentable: true,
      rentPerDay: 2200.0,
      depositFee: 8000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p1.id, url: 'http://localhost:5000/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p1.id, sectionName: 'Complete Set Options', optionName: 'Balochi Doch', priceMarkup: 0.0 },
      { productId: p1.id, sectionName: 'Complete Set Options', optionName: 'Poll', priceMarkup: 1500.0 }
    ]
  });

  // 2. Premium Silk Sareeg (8decb73422eb0f3e899d810211a5a4e6.png)
  const p2 = await prisma.product.create({
    data: {
      name: 'Premium Silk Sareeg',
      description: 'Elegant headscarf (Sareeg) crafted from raw silk, accented with intricate Kureshi border patterns.',
      category: 'Sareeg',
      basePrice: 6500.0,
      stockQuantity: 10,
      isRentable: true,
      rentPerDay: 600.0,
      depositFee: 2000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p2.id, url: 'http://localhost:5000/uploads/8decb73422eb0f3e899d810211a5a4e6.png', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p2.id, sectionName: 'Sareeg Components', optionName: 'Koreshi', priceMarkup: 500.0 },
      { productId: p2.id, sectionName: 'Sareeg Components', optionName: 'Pikko', priceMarkup: 300.0 },
      { productId: p2.id, sectionName: 'Sareeg Components', optionName: 'Pith', priceMarkup: 1000.0 },
      { productId: p2.id, sectionName: 'Sareeg Components', optionName: 'Doch', priceMarkup: 2000.0 },
      { productId: p2.id, sectionName: 'Sareeg Components', optionName: 'Poll', priceMarkup: 500.0 }
    ]
  });

  // 3. Classic Traditional Balochi Set (IMG-20260607-WA0001.jpg)
  const p3 = await prisma.product.create({
    data: {
      name: 'Classic Traditional Balochi Set',
      description: 'A masterpiece complete set showcasing authentic artisan handcrafting and local textures.',
      category: 'Complete Balochi Sets',
      basePrice: 24000.0,
      stockQuantity: 3,
      isRentable: true,
      rentPerDay: 2400.0,
      depositFee: 9000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p3.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0001.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p3.id, sectionName: 'Complete Set Options', optionName: 'Balochi Doch', priceMarkup: 0.0 },
      { productId: p3.id, sectionName: 'Complete Set Options', optionName: 'Poll', priceMarkup: 1500.0 }
    ]
  });

  // 4. Bridal Special Balochi Suit (IMG-20260607-WA0002.jpg)
  const p4 = await prisma.product.create({
    data: {
      name: 'Bridal Special Balochi Suit',
      description: 'Heavily adorned wedding suit detailed with antique golden threads and authentic stitching.',
      category: 'Complete Balochi Sets',
      basePrice: 32000.0,
      stockQuantity: 2,
      isRentable: true,
      rentPerDay: 3500.0,
      depositFee: 12000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p4.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0002.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p4.id, sectionName: 'Complete Set Options', optionName: 'Balochi Doch', priceMarkup: 0.0 },
      { productId: p4.id, sectionName: 'Complete Set Options', optionName: 'Poll', priceMarkup: 2000.0 }
    ]
  });

  // 5. Handmade Koreshi & Pikko Sareeg (IMG-20260607-WA0003.jpg)
  const p5 = await prisma.product.create({
    data: {
      name: 'Handmade Koreshi & Pikko Sareeg',
      description: 'Dupatta styled with delicate micro-loops and traditional scalloped border stitches.',
      category: 'Sareeg',
      basePrice: 5800.0,
      stockQuantity: 8,
      isRentable: true,
      rentPerDay: 500.0,
      depositFee: 1800.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p5.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0003.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p5.id, sectionName: 'Sareeg Components', optionName: 'Koreshi', priceMarkup: 400.0 },
      { productId: p5.id, sectionName: 'Sareeg Components', optionName: 'Pikko', priceMarkup: 300.0 }
    ]
  });

  // 6. Floral Motifs Cotton Sareeg (IMG-20260607-WA0004.jpg)
  const p6 = await prisma.product.create({
    data: {
      name: 'Floral Motifs Cotton Sareeg',
      description: 'Soft cotton Sareeg finished with colorful floral embroidery patterns.',
      category: 'Sareeg',
      basePrice: 6200.0,
      stockQuantity: 6,
      isRentable: true,
      rentPerDay: 600.0,
      depositFee: 2000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p6.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0004.jpg', isPrimary: true }
  });

  // 7. Delicate Kureshi Chaddar Border (IMG-20260607-WA0006.jpg)
  const p7 = await prisma.product.create({
    data: {
      name: 'Delicate Kureshi Chaddar Border',
      description: 'Wide sheet wrapper displaying a thick hand-loomed border panel of cotton thread.',
      category: 'Chaddar Tikk / Border',
      basePrice: 7900.0,
      stockQuantity: 5,
      isRentable: true,
      rentPerDay: 750.0,
      depositFee: 2500.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p7.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0006.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p7.id, sectionName: '3.1 Border', optionName: 'Border', priceMarkup: 800.0 },
      { productId: p7.id, sectionName: '3.3 Kureshi', optionName: 'Bala Morag', priceMarkup: 1200.0 }
    ]
  });

  // 8. Bala Morag Chaddar Tikk (IMG-20260607-WA0007.jpg)
  const p8 = await prisma.product.create({
    data: {
      name: 'Bala Morag Chaddar Tikk',
      description: 'Premium Chaddar featuring a gorgeous central Tikk motif in traditional crimson colors.',
      category: 'Chaddar Tikk / Border',
      basePrice: 8900.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 900.0,
      depositFee: 3000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p8.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0007.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p8.id, sectionName: '3.2 Tikk', optionName: 'Tikk', priceMarkup: 600.0 },
      { productId: p8.id, sectionName: '3.3 Kureshi', optionName: 'Bala Morag', priceMarkup: 1200.0 }
    ]
  });

  // 9. Irani Morag Embroidered Sheet (IMG-20260607-WA0008.jpg)
  const p9 = await prisma.product.create({
    data: {
      name: 'Irani Morag Embroidered Sheet',
      description: 'Chaddar sheet showcasing the classic Irani Morag pattern of interlocking loops.',
      category: 'Chaddar Tikk / Border',
      basePrice: 9500.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 950.0,
      depositFee: 3000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p9.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0008.jpg', isPrimary: true }
  });

  // 10. Classic Pashko & Shalwar Suit (IMG-20260607-WA0009.jpg)
  const p10 = await prisma.product.create({
    data: {
      name: 'Classic Pashko & Shalwar Suit',
      description: 'Stitched dress composed of a classic high-collar Pashk and a matching trouser.',
      category: 'Pashko / Shalwar',
      basePrice: 11000.0,
      stockQuantity: 6,
      isRentable: true,
      rentPerDay: 1100.0,
      depositFee: 4000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p10.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0009.jpg', isPrimary: true }
  });

  // 11. Modern Fit Balochi Pashko (IMG-20260607-WA0011.jpg)
  const p11 = await prisma.product.create({
    data: {
      name: 'Modern Fit Balochi Pashko',
      description: 'Tailored with slightly slimmer cuts, integrating traditional sleeve border bands.',
      category: 'Pashko / Shalwar',
      basePrice: 12500.0,
      stockQuantity: 5,
      isRentable: true,
      rentPerDay: 1200.0,
      depositFee: 4000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p11.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0011.jpg', isPrimary: true }
  });

  // 12. Handcrafted Neem Doch Daily Wear (IMG-20260607-WA0012.jpg)
  const p12 = await prisma.product.create({
    data: {
      name: 'Handcrafted Neem Doch Daily Wear',
      description: 'Casual comfort suit displaying a elegant half-neck Neem Doch embroidery design.',
      category: 'Neem Doch',
      basePrice: 9800.0,
      stockQuantity: 8,
      isRentable: true,
      rentPerDay: 900.0,
      depositFee: 3000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p12.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0012.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p12.id, sectionName: 'Neem Doch Options', optionName: 'Sarfag', priceMarkup: 500.0 },
      { productId: p12.id, sectionName: 'Neem Doch Options', optionName: 'Zai', priceMarkup: 400.0 },
      { productId: p12.id, sectionName: 'Neem Doch Options', optionName: 'Pitt', priceMarkup: 400.0 }
    ]
  });

  // 13. Premium Neem Doch Party Wear (IMG-20260607-WA0013.jpg)
  const p13 = await prisma.product.create({
    data: {
      name: 'Premium Neem Doch Party Wear',
      description: 'Formal outfit adorned with detailed Neem Doch and mirror glass details.',
      category: 'Neem Doch',
      basePrice: 13500.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 1300.0,
      depositFee: 4500.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p13.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0013.jpg', isPrimary: true }
  });

  // 14. Classic Pitt Doch Trouser Suit (IMG-20260607-WA0014.jpg)
  const p14 = await prisma.product.create({
    data: {
      name: 'Classic Pitt Doch Trouser Suit',
      description: 'Two-piece set detailed with flat-braid Pitt Doch lines along the neck and pocket.',
      category: 'Pitt Doch',
      basePrice: 11900.0,
      stockQuantity: 5,
      isRentable: true,
      rentPerDay: 1100.0,
      depositFee: 3500.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p14.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0014.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p14.id, sectionName: 'Pitt Doch Components', optionName: 'Taloki Pitt / Chiloki Pitt', priceMarkup: 600.0 },
      { productId: p14.id, sectionName: 'Pitt Doch Components', optionName: 'Sya Spait', priceMarkup: 700.0 }
    ]
  });

  // 15. Luxury Taloki Pitt Doch Dress (IMG-20260607-WA0015.jpg)
  const p15 = await prisma.product.create({
    data: {
      name: 'Luxury Taloki Pitt Doch Dress',
      description: 'High-end festive dress showcasing double-layered Taloki Pitt and golden accents.',
      category: 'Pitt Doch',
      basePrice: 14500.0,
      stockQuantity: 3,
      isRentable: true,
      rentPerDay: 1500.0,
      depositFee: 5000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p15.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0015.jpg', isPrimary: true }
  });

  // 16. Double Contrast Do-Rangi Suit (IMG-20260607-WA0016.jpg)
  const p16 = await prisma.product.create({
    data: {
      name: 'Double Contrast Do-Rangi Suit',
      description: 'Contrasting color panels (Do-Rangi) stitched with traditional geometric Balochi patterns.',
      category: 'Do-Rangi',
      basePrice: 13800.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 1400.0,
      depositFee: 4500.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p16.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0016.jpg', isPrimary: true }
  });
  await prisma.productCustomizationOption.createMany({
    data: [
      { productId: p16.id, sectionName: 'Do-Rangi Components', optionName: 'Taloki Pitt / Chiloki Pitt', priceMarkup: 600.0 },
      { productId: p16.id, sectionName: 'Do-Rangi Components', optionName: 'Kanch', priceMarkup: 1200.0 }
    ]
  });

  // 17. Vibrant Mirror-Work Do-Rangi Attire (IMG-20260607-WA0017.jpg)
  const p17 = await prisma.product.create({
    data: {
      name: 'Vibrant Mirror-Work Do-Rangi Attire',
      description: 'Vivid hues with embedded circular mirrors reflecting Balochi coastal styles.',
      category: 'Do-Rangi',
      basePrice: 15000.0,
      stockQuantity: 3,
      isRentable: true,
      rentPerDay: 1500.0,
      depositFee: 5000.0,
      allowsCustomEmbroidery: true,
    },
  });
  await prisma.productImage.create({
    data: { productId: p17.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0017.jpg', isPrimary: true }
  });

  // 18. Traditional Patt Dhamman Suit (IMG-20260607-WA0018.jpg)
  const p18 = await prisma.product.create({
    data: {
      name: 'Traditional Patt Dhamman Suit',
      description: 'Specialty dress utilizing a broad bottom border (Patt Dhamman) finished with colorful threads.',
      category: 'Patt Dhamman',
      basePrice: 15500.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 1500.0,
      depositFee: 5000.0,
      allowsCustomEmbroidery: false,
    },
  });
  await prisma.productImage.create({
    data: { productId: p18.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0018.jpg', isPrimary: true }
  });

  // 19. Handcrafted Baroo Tikk Dress (IMG-20260607-WA0019.jpg)
  const p19 = await prisma.product.create({
    data: {
      name: 'Handcrafted Baroo Tikk Dress',
      description: 'Iconic dress featuring multiple spaced Baroo Tikk motifs decorating the front panel.',
      category: 'Baroo Tikk',
      basePrice: 13500.0,
      stockQuantity: 4,
      isRentable: true,
      rentPerDay: 1300.0,
      depositFee: 4000.0,
      allowsCustomEmbroidery: false,
    },
  });
  await prisma.productImage.create({
    data: { productId: p19.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0019.jpg', isPrimary: true }
  });

  // 20. Boon Chera Daig Luxury Wedding Dress (IMG-20260607-WA0020.jpg)
  const p20 = await prisma.product.create({
    data: {
      name: 'Boon Chera Daig Luxury Wedding Dress',
      description: 'Extravagant festive design displaying heavy Boon Chera Daig stitch grids across the front panel.',
      category: 'Boon Chera Daig',
      basePrice: 18500.0,
      stockQuantity: 2,
      isRentable: true,
      rentPerDay: 1800.0,
      depositFee: 6000.0,
      allowsCustomEmbroidery: false,
    },
  });
  await prisma.productImage.create({
    data: { productId: p20.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0020.jpg', isPrimary: true }
  });

  // 21. Rad Baro Traditional Suite (IMG-20260607-WA0021.jpg)
  const p21 = await prisma.product.create({
    data: {
      name: 'Rad Baro Traditional Suite',
      description: 'Regional specialty outfit tailored with custom sleeve ends in the classic Rad Baro technique.',
      category: 'Rad Baro',
      basePrice: 14200.0,
      stockQuantity: 5,
      isRentable: true,
      rentPerDay: 1400.0,
      depositFee: 4500.0,
      allowsCustomEmbroidery: false,
    },
  });
  await prisma.productImage.create({
    data: { productId: p21.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0021.jpg', isPrimary: true }
  });

  // 22. Machine Made Embroidered Balochi Suit (IMG-20260607-WA0022.jpg)
  const p22 = await prisma.product.create({
    data: {
      name: 'Machine Made Embroidered Balochi Suit',
      description: 'Ready-to-wear computer embroidered suit offering speed, reliability, and modern color blends.',
      category: 'Machine made',
      basePrice: 6500.0,
      stockQuantity: 15,
      isRentable: false,
      allowsCustomEmbroidery: false,
    },
  });
  await prisma.productImage.create({
    data: { productId: p22.id, url: 'http://localhost:5000/uploads/IMG-20260607-WA0022.jpg', isPrimary: true }
  });

  console.log('22 unique products successfully seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
