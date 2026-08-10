// bookstore-backend/src/app.ts

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session'; // 🔥 AJOUTÉ
import passport from 'passport'; // 🔥 AJOUTÉ

import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import userRoutes from './routes/user.routes';
import loanRoutes from './routes/loan.routes';
import saleRoutes from './routes/sale.routes';
import adminRoutes from './routes/admin.routes';

import { ErrorMiddleware } from './middlewares/error.middleware';

// 🔥 IMPORTER LA CONFIGURATION PASSPORT
import './config/passport'; 

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // 🔥 SESSION MIDDLEWARE (Nécessaire pour Passport)
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'mon-session-secret-temp-12345',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
      }
    }));

    // 🔥 INITIALISER PASSPORT
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/books', bookRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/loans', loanRoutes);
    this.app.use('/api/sales', saleRoutes);
    this.app.use('/api/admin', adminRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.handleError);
  }

  public listen(): void {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  }
}

export default App;