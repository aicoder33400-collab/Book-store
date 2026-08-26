import { Request, Response } from 'express';
import { PrismaClient, CopyStatus } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class BookController {
  getAllBooks = catchAsync(async (req: Request, res: Response) => {
    const books = await prisma.book.findMany({
      include: {
        copies: {
          where: { status: 'AVAILABLE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const booksWithCount = books.map((book) => ({
      ...book,
      availableQuantity: book.copies?.length || 0,
    }));
    
    return res.json(ApiResponse.success(booksWithCount));
  });

  getBookById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: true,
      },
    });
    
    if (!book) {
      return res.status(404).json(ApiResponse.error('Livre non trouvé'));
    }
    
    const availableCopies = book.copies?.filter((c) => c.status === 'AVAILABLE').length || 0;
    
    return res.json(ApiResponse.success({
      ...book,
      availableCopies,
    }));
  });

  createBook = catchAsync(async (req: Request, res: Response) => {
    const { title, author, isbn, description, totalCopies, genre, language } = req.body;
    
    const copiesCount = parseInt(totalCopies) || 1;
    
    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        description,
        totalCopies: copiesCount,
        isForRent: true,
        genre: genre || 'AUTRE',
        language: language || 'FRANCAIS',
      },
    });

    const copies = [];
    for (let i = 1; i <= copiesCount; i++) {
      copies.push({
        bookId: book.id,
        copyNumber: i,
        status: 'AVAILABLE' as CopyStatus,
      });
    }
    
    await prisma.copy.createMany({
      data: copies,
    });

    return res.status(201).json(ApiResponse.success({
      ...book,
      availableQuantity: copiesCount,
    }, 'Livre créé'));
  });

  updateBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, author, isbn, description, totalCopies, genre, language } = req.body;

    const existing = await prisma.book.findUnique({ 
      where: { id },
      include: { copies: true },
    });
    
    if (!existing) {
      return res.status(404).json(ApiResponse.error('Livre non trouvé'));
    }

    const newTotal = parseInt(totalCopies) || existing.totalCopies;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn,
        description,
        totalCopies: newTotal,
        genre: genre || existing.genre,
        language: language || existing.language,
      },
    });

    const currentCopies = await prisma.copy.count({
      where: { bookId: id },
    });
    
    if (newTotal > currentCopies) {
      const copies = [];
      for (let i = currentCopies + 1; i <= newTotal; i++) {
        copies.push({
          bookId: id,
          copyNumber: i,
          status: 'AVAILABLE' as CopyStatus,
        });
      }
      await prisma.copy.createMany({ data: copies });
    }

    return res.json(ApiResponse.success(book, 'Livre mis à jour'));
  });

  deleteBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.book.delete({ where: { id } });
    return res.json(ApiResponse.success(null, 'Livre supprimé'));
  });

  uploadImage = catchAsync(async (req: Request, res: Response) => {
    try {
      const { bookId, imageBase64 } = req.body;

      if (!bookId) {
        return res.status(400).json(ApiResponse.error('ID du livre manquant'));
      }

      if (!imageBase64) {
        return res.status(400).json(ApiResponse.error('Image manquante'));
      }

      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        return res.status(404).json(ApiResponse.error('Livre non trouvé'));
      }
      
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const fileName = `${uuidv4()}.jpg`;
      const uploadDir = path.join(__dirname, '../../uploads/books');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const imageUrl = `/uploads/books/${fileName}`;

      const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: { imageUrl },
      });

      return res.json({
        success: true,
        data: { imageUrl },
        message: 'Image ajoutée avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      return res.status(500).json(ApiResponse.error(error.message));
    }
  });
}