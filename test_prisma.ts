import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.wishlistItem.upsert({
  where: {
    user_product: {
      userId: '1',
      productId: '2'
    }
  },
  update: {},
  create: {
    userId: '1',
    productId: '2'
  }
});
