import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 0. Create Admin User
  const adminPassword = await bcrypt.hash('Kiswa@Admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kiswa.pk' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@kiswa.pk',
      name: 'Kiswa Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Ensured admin user exists: ${admin.email}`);

  // 1. Create Categories
  const category1 = await prisma.category.upsert({
    where: { slug: 'everyday-wear' },
    update: {},
    create: {
      name: 'Everyday Wear',
      slug: 'everyday-wear',
      description: 'Premium clothing for everyday comfort and style.',
    },
  });

  const category2 = await prisma.category.upsert({
    where: { slug: 'luxury-watches' },
    update: {},
    create: {
      name: 'Luxury Watches',
      slug: 'luxury-watches',
      description: 'Masterpieces in time, crafted with precision.',
    },
  });

  console.log(`Created categories: ${category1.name}, ${category2.name}`);

  // 2. Sample Products with Variants
  const products = [
    {
      name: 'The Obsidian Blazer',
      slug: 'obsidian-blazer',
      description: 'A tailored black blazer made from premium wool blend. Perfect for formal and smart casual events.',
      basePrice: 24500,
      isFeatured: true,
      categoryId: category1.id,
      images: '/images/obsidian-blazer.jpg',
      variants: {
        create: [
          { size: 'S', color: 'Black', stockQty: 10 },
          { size: 'M', color: 'Black', stockQty: 15 },
          { size: 'L', color: 'Black', stockQty: 5 },
        ],
      },
    },
    {
      name: 'Classic Silk Shirt',
      slug: 'classic-silk-shirt',
      description: 'A luxurious 100% silk shirt in pristine white.',
      basePrice: 12500,
      isFeatured: true,
      categoryId: category1.id,
      images: '/images/silk-shirt.jpg',
      variants: {
        create: [
          { size: 'M', color: 'White', stockQty: 8 },
          { size: 'L', color: 'White', stockQty: 12 },
        ],
      },
    },
    {
      name: 'Heritage Chronograph',
      slug: 'heritage-chronograph',
      description: 'A timeless mechanical chronograph watch featuring a genuine leather strap and sapphire crystal.',
      basePrice: 45000,
      isFeatured: true,
      categoryId: category2.id,
      images: '/images/heritage-chrono.jpg',
      variants: {
        create: [
          { size: '42mm', color: 'Silver/Black', stockQty: 4 }
        ],
      },
    },
    {
      name: 'Minimalist Cuff',
      slug: 'minimalist-cuff',
      description: 'An elegant slip-on watch that complements any wardrobe.',
      basePrice: 8200,
      isFeatured: true,
      categoryId: category2.id,
      images: '/images/minimalist-cuff.jpg',
      variants: {
        create: [
          { size: 'One Size', color: 'Rose Gold', stockQty: 20 },
        ],
      },
    }
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    console.log(`Created product: ${createdProduct.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
