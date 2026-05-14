import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'fahadali9355@gmail.com';
  
  console.log(`Checking for user with email: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { _count: { select: { orders: true } } }
  });
  
  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2));
  } else {
    console.log('User not found.');
  }

  console.log(`\nChecking for orders with guestEmail: ${email} or userId: ${user?.id}`);
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { guestEmail: email },
        { userId: user?.id }
      ]
    }
  });

  console.log(`Found ${orders.length} orders.`);
  orders.forEach(o => {
    console.log(`Order ID: ${o.id}, userId: ${o.userId}, guestEmail: ${o.guestEmail}, status: ${o.status}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
