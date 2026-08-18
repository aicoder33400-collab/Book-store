import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class BookController {
  getAllBooks = catchAsync(async (req: Request, res: Response) => {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(ApiResponse.success(books));
  });

  getBookById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json(ApiResponse.error('Livre non trouvé'));
    }
    return res.json(ApiResponse.success(book));
  });

  createBook = catchAsync(async (req: Request, res: Response) => {
    const { title, author, isbn, description, totalQuantity } = req.body;
    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        description,
        totalQuantity: parseInt(totalQuantity) || 1,
        availableQuantity: parseInt(totalQuantity) || 1,
        isForRent: true,
      },
    });
    return res.status(201).json(ApiResponse.success(book, 'Livre créé'));
  });

  updateBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, author, isbn, description, totalQuantity } = req.body;

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(ApiResponse.error('Livre non trouvé'));
    }

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn,
        description,
        totalQuantity: parseInt(totalQuantity) || existing.totalQuantity,
        availableQuantity: parseInt(totalQuantity) || existing.availableQuantity,
      },
    });
    return res.json(ApiResponse.success(book, 'Livre mis à jour'));
  });

  deleteBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.book.delete({ where: { id } });
    return res.json(ApiResponse.success(null, 'Livre supprimé'));
  });

  // 🔥 Upload d'image en base64
  uploadImage = catchAsync(async (req: Request, res: Response) => {
    try {
      const { bookId, imageBase64, filename } = req.body;

      console.log('📸 Upload base64 - bookId:', bookId);
      console.log('📸 Filename:', filename);

      if (!bookId) {
        return res.status(400).json({ success: false, message: 'ID du livre manquant' });
      }

      if (!imageBase64) {
        return res.status(400).json({ success: false, message: 'Image manquante' });
      }

      // Vérifier que le livre existe
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        return res.status(404).json({ success: false, message: 'Livre non trouvé' });
      }

      // Supprimer le préfixe data:image/...;base64,
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      // Générer un nom de fichier
      const ext = filename?.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads/books');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Écrire le fichier
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
      return res.status(500).json({ success: false, message: error.message });
    }
  });
}