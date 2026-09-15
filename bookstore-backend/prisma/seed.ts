import { PrismaClient, CopyStatus, BookGenre, BookLanguage } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // === 1. CRÉER LES UTILISATEURS ===
  const adminPassword = await bcrypt.hash('admin111', 10);
  await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      email: 'admin@bookstore.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'ADMIN',
      authProvider: 'local',
      emailVerified: true,
      isProfileComplete: true,
      phone: '0612345678',
      commune: 'Paris',
      age: 30,
    },
  });
  console.log('✅ Admin créé');

  const staffPassword = await bcrypt.hash('staff111', 10);
  await prisma.user.upsert({
    where: { email: 'staff@bookstore.com' },
    update: {},
    create: {
      email: 'staff@bookstore.com',
      name: 'Staff User',
      firstName: 'Staff',
      lastName: 'User',
      password: staffPassword,
      role: 'STAFF',
      authProvider: 'local',
      emailVerified: true,
      isProfileComplete: true,
      phone: '0687654321',
      commune: 'Lyon',
      age: 28,
    },
  });
  console.log('✅ Staff créé');

  const userPassword = await bcrypt.hash('user111', 10);
  await prisma.user.upsert({
    where: { email: 'user@bookstore.com' },
    update: {},
    create: {
      email: 'user@bookstore.com',
      name: 'Jean Dupont',
      firstName: 'Jean',
      lastName: 'Dupont',
      password: userPassword,
      role: 'USER',
      authProvider: 'local',
      emailVerified: true,
      isProfileComplete: true,
      phone: '0612345678',
      commune: 'Paris',
      age: 25,
    },
  });
  console.log('✅ User créé');

  // === 2. CRÉER LES LIVRES AVEC LEURS COPIES ===
  const booksData = [
    {
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
      description: "Le chef-d'œuvre intemporel de la littérature française.",
      totalCopies: 5,
      genre: "ROMAN" as BookGenre,
      language: "FRANCAIS" as BookLanguage,
    },
    {
      title: "1984",
      author: "George Orwell",
      description: "Une dystopie visionnaire sur la surveillance totale.",
      totalCopies: 3,
      genre: "SCIENCE_FICTION" as BookGenre,
      language: "ANGLAIS" as BookLanguage,
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      description: "Le roman de science-fiction le plus vendu au monde.",
      totalCopies: 4,
      genre: "SCIENCE_FICTION" as BookGenre,
      language: "ANGLAIS" as BookLanguage,
    },
    {
      title: "L'Étranger",
      author: "Albert Camus",
      description: "Un classique de la littérature française.",
      totalCopies: 3,
      genre: "ROMAN" as BookGenre,
      language: "FRANCAIS" as BookLanguage,
    },
    {
      title: "Harry Potter à l'école des sorciers",
      author: "J.K. Rowling",
      description: "Le premier tome de la saga Harry Potter.",
      totalCopies: 6,
      genre: "FANTASTIQUE" as BookGenre,
      language: "ANGLAIS" as BookLanguage,
    },
    {
      title: "Le Seigneur des Anneaux",
      author: "J.R.R. Tolkien",
      description: "La trilogie de référence de la fantasy.",
      totalCopies: 4,
      genre: "FANTASTIQUE" as BookGenre,
      language: "ANGLAIS" as BookLanguage,
    },
    {
      title: "La Peste",
      author: "Albert Camus",
      description: "Un roman majeur d'Albert Camus.",
      totalCopies: 3,
      genre: "ROMAN" as BookGenre,
      language: "FRANCAIS" as BookLanguage,
    },
    {
      title: "Les Misérables",
      author: "Victor Hugo",
      description: "Le chef-d'œuvre de Victor Hugo.",
      totalCopies: 5,
      genre: "ROMAN" as BookGenre,
      language: "FRANCAIS" as BookLanguage,
    },
    {
      title: "Le Guide du voyageur galactique",
      author: "Douglas Adams",
      description: "Une comédie de science-fiction hilarante.",
      totalCopies: 3,
      genre: "SCIENCE_FICTION" as BookGenre,
      language: "ANGLAIS" as BookLanguage,
    },
    {
      title: "Les Fleurs du Mal",
      author: "Charles Baudelaire",
      description: "Recueil de poésie de Charles Baudelaire.",
      totalCopies: 2,
      genre: "POESIE" as BookGenre,
      language: "FRANCAIS" as BookLanguage,
    },
  ];

  console.log('\n📚 Création des livres...');
  
  for (const bookData of booksData) {
    // 🔥 Chercher par titre + auteur (car isbn n'existe plus)
    let book = await prisma.book.findFirst({
      where: {
        title: bookData.title,
        author: bookData.author,
      },
    });

    if (book) {
      // Mettre à jour le livre existant
      book = await prisma.book.update({
        where: { id: book.id },
        data: {
          description: bookData.description,
          totalCopies: bookData.totalCopies,
          genre: bookData.genre,
          language: bookData.language,
        },
      });
    } else {
      // Créer un nouveau livre
      book = await prisma.book.create({
        data: {
          title: bookData.title,
          author: bookData.author,
          description: bookData.description,
          totalCopies: bookData.totalCopies,
          isForRent: true,
          genre: bookData.genre,
          language: bookData.language,
        },
      });
    }

    // 🔥 Vérifier et créer les copies manquantes
    const existingCopies = await prisma.copy.count({
      where: { bookId: book.id },
    });

    if (existingCopies < bookData.totalCopies) {
      const copiesToCreate = [];
      for (let i = existingCopies + 1; i <= bookData.totalCopies; i++) {
        copiesToCreate.push({
          bookId: book.id,
          copyNumber: i,
          status: 'AVAILABLE' as CopyStatus,
        });
      }
      
      if (copiesToCreate.length > 0) {
        await prisma.copy.createMany({
          data: copiesToCreate,
        });
        console.log(`   ✅ ${copiesToCreate.length} copies créées pour "${bookData.title}"`);
      }
    } else {
      console.log(`   ✅ "${bookData.title}" déjà ${existingCopies} copies`);
    }
  }

  console.log(`\n✅ ${booksData.length} livres créés/mis à jour avec leurs copies`);
  console.log('\n📋 Comptes de test:');
  console.log('  👑 Admin: admin@bookstore.com / admin111');
  console.log('  📋 Staff: staff@bookstore.com / staff111');
  console.log('  👤 User: user@bookstore.com / user111');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
