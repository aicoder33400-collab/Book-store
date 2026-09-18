import { PrismaClient, BookGenre, BookLanguage } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// LIVRES ISLAMIQUES
// ═══════════════════════════════════════════════════
const ISLAMIC_BOOKS = [
  // ═══ CORAN ═══
  {
    title: 'Le Saint Coran (bilingue arabe-français)',
    author: 'Traduction Muhammad Hamidullah',
    description: 'Traduction du Saint Coran en français avec le texte arabe en regard. Une référence pour les francophones.',
    genre: 'CORAN' as BookGenre,
    language: 'ARABE_FRANCAIS' as BookLanguage,
    totalCopies: 10,
  },
  {
    title: 'Le Noble Coran (arabe)',
    author: 'Édition Dar al-Ma\u2019rifa',
    description: 'Le Coran en arabe uniquement, avec tajwid coloré. Format poche.',
    genre: 'CORAN' as BookGenre,
    language: 'ARABE' as BookLanguage,
    totalCopies: 8,
  },

  // ═══ TAFSIR ═══
  {
    title: 'Tafsir Ibn Kathir (10 volumes)',
    author: 'Ibn Kathir',
    description: 'Exégèse complète du Coran en 10 volumes, traduite en français. Une référence incontournable.',
    genre: 'TAFSIR' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 3,
  },
  {
    title: 'Le Tafsir des versets coraniques',
    author: 'Mohammed al-Ghazali',
    description: 'Commentaire spirituel et philosophique du Coran par l\u2019imam al-Ghazali.',
    genre: 'TAFSIR' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },

  // ═══ HADITH ═══
  {
    title: 'Sahih al-Bukhari (résumé)',
    author: 'Imam al-Bukhari',
    description: 'Recueil de hadiths authentiques du Prophète ﷺ. Résumé en un volume.',
    genre: 'HADITH' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 5,
  },
  {
    title: 'Riyad as-Salihin',
    author: 'Imam an-Nawawi',
    description: 'Les jardins des vertueux — compilation de hadiths sur la morale islamique.',
    genre: 'HADITH' as BookGenre,
    language: 'ARABE_FRANCAIS' as BookLanguage,
    totalCopies: 6,
  },
  {
    title: 'Les 40 Hadiths Nawawi',
    author: 'Imam an-Nawawi',
    description: 'Quarante hadiths fondamentaux commentés. Idéal pour débuter.',
    genre: 'HADITH' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 8,
  },

  // ═══ FIQH ═══
  {
    title: 'La jurisprudence islamique simplifiée',
    author: 'Cheikh Yusuf al-Qaradawi',
    description: 'Manuel de fiqh couvrant les règles essentielles de la pratique islamique.',
    genre: 'FIQH' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 5,
  },
  {
    title: 'Fiqh as-Sunna',
    author: 'Sayyid Sabiq',
    description: 'Référence classique de fiqh comparé, très accessible.',
    genre: 'FIQH' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },
  {
    title: 'La prière en islam',
    author: 'Cheikh al-Albani',
    description: 'Description complète et détaillée de la prière prophétique.',
    genre: 'FIQH' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 6,
  },

  // ═══ AQIDA (Crédo) ═══
  {
    title: 'Le livre du Tawhid',
    author: 'Mohammed ibn Abd al-Wahhab',
    description: 'Fondements du monothéisme pur en islam.',
    genre: 'AQIDA' as BookGenre,
    language: 'ARABE_FRANCAIS' as BookLanguage,
    totalCopies: 5,
  },

  // ═══ SIRA (Biographie du Prophète ﷺ) ═══
  {
    title: 'La Sira du Prophète ﷺ',
    author: 'Ibn Hisham',
    description: 'Biographie complète du Prophète Muhammad ﷺ.',
    genre: 'SIRA' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 6,
  },
  {
    title: 'Muhammad, sceau des Prophètes',
    author: 'Rashid Rida',
    description: 'Biographie spirituelle et historique du Prophète ﷺ.',
    genre: 'SIRA' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },

  // ═══ SUNNA ═══
  {
    title: 'La Sunna : source de sagesse',
    author: 'Dr. Mostafa al-Siba\u2019i',
    description: 'Étude sur la place de la Sunna dans la législation islamique.',
    genre: 'SUNNA' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 3,
  },

  // ═══ SPIRITUALITÉ ═══
  {
    title: 'Revivification des sciences de la religion',
    author: 'Imam al-Ghazali',
    description: 'Ihya\u2019 Ouloum ad-Din — œuvre majeure sur la spiritualité islamique.',
    genre: 'SPIRITUALITE' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },
  {
    title: 'Le jardin des sages',
    author: 'Ibn \u2019Ata\u2019 Allah',
    description: 'Recueil d\u2019aphorismes spirituels.',
    genre: 'SPIRITUALITE' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 3,
  },

  // ═══ HISTOIRE ISLAMIQUE ═══
  {
    title: 'Histoire de la civilisation islamique',
    author: 'Marshall Hodgson',
    description: 'Vaste fresque historique de la civilisation musulmane.',
    genre: 'HISTOIRE_ISLAMIQUE' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },
  {
    title: 'Les Califes bien guidés',
    author: 'Dr. as-Sallabi',
    description: 'Biographies des quatre Califes bien guidés.',
    genre: 'HISTOIRE_ISLAMIQUE' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 5,
  },

  // ═══ LANGUE ARABE ═══
  {
    title: 'Méthode de lecture coranique (Qa\u2019ida Nouraniya)',
    author: 'Cheikh Nour Muhammad Haqqani',
    description: 'Méthode d\u2019apprentissage de la lecture du Coran en arabe.',
    genre: 'LANGUE_ARABE' as BookGenre,
    language: 'ARABE_FRANCAIS' as BookLanguage,
    totalCopies: 8,
  },
  {
    title: 'Grammaire arabe simplifiée',
    author: 'Dr. V. Abdur Rahim',
    description: 'Manuel d\u2019apprentissage de la grammaire arabe (Nahw).',
    genre: 'LANGUE_ARABE' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 6,
  },

  // ═══ ÉDUCATION ENFANTS ═══
  {
    title: 'Mon premier livre sur l\u2019islam',
    author: 'Éditions Al-Madina',
    description: 'Livre illustré pour enfants sur les bases de l\u2019islam.',
    genre: 'EDUCATION_ENFANTS' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 6,
  },
  {
    title: 'Histoires des Prophètes pour enfants',
    author: 'Saniyasnain Khan',
    description: 'Recueil illustré d\u2019histoires prophétiques pour les enfants.',
    genre: 'EDUCATION_ENFANTS' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 7,
  },

  // ═══ BIOGRAPHIE SAVANTS ═══
  {
    title: 'La vie de l\u2019imam al-Bukhari',
    author: 'Dr. as-Sallabi',
    description: 'Biographie du célèbre compilateur du Sahih.',
    genre: 'BIOGRAPHIE_SAVANTS' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 3,
  },

  // ═══ DIVERS ═══
  {
    title: 'L\u2019éthique du musulman',
    author: 'Imam al-Ghazali',
    description: 'Traité sur les bonnes manières et l\u2019éthique islamique.',
    genre: 'DIVERS' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 5,
  },
  {
    title: 'La famille en islam',
    author: 'Dr. Mohamed al-Hachimi',
    description: 'Guide sur le mariage, l\u2019éducation et la vie familiale en islam.',
    genre: 'DIVERS' as BookGenre,
    language: 'FRANCAIS' as BookLanguage,
    totalCopies: 4,
  },
];

async function main() {
  console.log('🌱 Début du seed...');

  // ═══ SUPPRESSION DE TOUT ═══
  console.log('🗑️  Nettoyage de la base...');
  await prisma.loan.deleteMany({});
  await prisma.copy.deleteMany({});
  await prisma.book.deleteMany({});

  // ═══ USERS PAR DÉFAUT ═══
  console.log('👥 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('admin111', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      email: 'admin@bookstore.com',
      name: 'Administrateur',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
      isProfileComplete: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@bookstore.com' },
    update: {},
    create: {
      email: 'staff@bookstore.com',
      name: 'Staff',
      password: hashedPassword,
      role: 'STAFF',
      emailVerified: true,
      isProfileComplete: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@bookstore.com' },
    update: {},
    create: {
      email: 'user@bookstore.com',
      name: 'Utilisateur',
      password: hashedPassword,
      role: 'USER',
      emailVerified: true,
      isProfileComplete: true,
    },
  });

  console.log(`  ✅ Admin : ${admin.email}`);
  console.log(`  ✅ Staff : ${staff.email}`);
  console.log(`  ✅ User  : ${user.email}`);

  // ═══ LIVRES ═══
  console.log('📚 Création des livres...');
  let createdCount = 0;

  for (const bookData of ISLAMIC_BOOKS) {
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        totalCopies: bookData.totalCopies,
        genre: bookData.genre,
        language: bookData.language,
        isForRent: true,
      },
    });

    // Créer les copies
    const copies = [];
    for (let i = 1; i <= bookData.totalCopies; i++) {
      copies.push({
        bookId: book.id,
        copyNumber: i,
        status: 'AVAILABLE' as const,
      });
    }
    await prisma.copy.createMany({ data: copies });

    createdCount++;
    console.log(`  ✅ ${bookData.title} (${bookData.totalCopies} copies)`);
  }

  console.log(`\n🎉 Seed terminé !`);
  console.log(`   - ${createdCount} livres créés`);
  console.log(`   - 3 utilisateurs (admin, staff, user)`);
}

main()
  .catch((e: any) => {
    console.error('❌ Erreur seed:', e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });