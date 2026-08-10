import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin111', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bookstore.com',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Create staff user
  const staffPassword = await bcrypt.hash('staff111', 10);
  await prisma.user.upsert({
    where: { email: 'staff@bookstore.com' },
    update: {},
    create: {
      name: 'Staff Member',
      email: 'staff@bookstore.com',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: true,
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user111', 10);
  await prisma.user.upsert({
    where: { email: 'user@bookstore.com' },
    update: {},
    create: {
      name: 'Jean Dupont',
      email: 'user@bookstore.com',
      password: userPassword,
      role: 'USER',
      emailVerified: true,
    },
  });

  // Create books
  const books = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0743273565',
      description: 'A story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
      totalQuantity: 5,
      availableQuantity: 5,
      isForSale: true,
      isForRent: true,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0451524935',
      description: 'A dystopian social science fiction novel set in a totalitarian society.',
      totalQuantity: 3,
      availableQuantity: 3,
      isForSale: true,
      isForRent: true,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0446310789',
      description: 'A novel about racial injustice in the American South.',
      totalQuantity: 4,
      availableQuantity: 4,
      isForSale: true,
      isForRent: false,
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0141439518',
      description: 'A romantic novel following Elizabeth Bennet.',
      totalQuantity: 6,
      availableQuantity: 6,
      isForSale: true,
      isForRent: true,
    },
    {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0316769488',
      description: 'Holden Caulfield in New York City after prep school.',
      totalQuantity: 2,
      availableQuantity: 2,
      isForSale: false,
      isForRent: true,
    },
    {
      title: 'One Hundred Years of Solitude',
      author: 'Gabriel García Márquez',
      isbn: '978-0060883287',
      description: 'The multi-generational story of the Buendía family.',
      totalQuantity: 3,
      availableQuantity: 3,
      isForSale: true,
      isForRent: true,
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0547928227',
      description: 'Bilbo Baggins quest to reclaim Erebor from the dragon Smaug.',
      totalQuantity: 7,
      availableQuantity: 7,
      isForSale: true,
      isForRent: true,
    },
    {
      title: 'Brave New World',
      author: 'Aldous Huxley',
      isbn: '978-0060850524',
      description: 'A futuristic World State with engineered social hierarchy.',
      totalQuantity: 4,
      availableQuantity: 4,
      isForSale: true,
      isForRent: false,
    },
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '978-0062315007',
      description: 'An Andalusian shepherd boy searching for treasure.',
      totalQuantity: 5,
      availableQuantity: 5,
      isForSale: true,
      isForRent: true,
    },
    {
      title: 'Crime and Punishment',
      author: 'Fyodor Dostoevsky',
      isbn: '978-0143058144',
      description: 'Mental anguish of an impoverished ex-student in Saint Petersburg.',
      totalQuantity: 2,
      availableQuantity: 2,
      isForSale: true,
      isForRent: true,
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    });
  }

  console.log('✅ Admin: admin@bookstore.com / admin111');
  console.log('✅ Staff: staff@bookstore.com / staff111');
  console.log('✅ User: user@bookstore.com / user111');
  console.log(`✅ ${books.length} books created`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
