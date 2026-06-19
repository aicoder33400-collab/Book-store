import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin111', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bookstore.com',
      password: hashedPassword,
      role: 'ADMIN', // Utilisez directement la string
    },
  });

  console.log('Admin user created: admin@bookstore.com / admin111');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());