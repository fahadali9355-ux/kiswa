import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'fahadali9355@gmail.com';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found.');
    return;
  }

  const result = await prisma.order.updateMany({
    where: {
      guestEmail: email,
      userId: null
    },
    data: {
      userId: user.id
    }
  });

  console.log(`Updated ${result.count} orders for ${email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
