import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import path from 'path';

import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import userRoutes from './routes/user.routes';
import loanRoutes from './routes/loan.routes';
import adminRoutes from './routes/admin.routes';

import { ErrorMiddleware } from './middlewares/error.middleware';

// Importer la configuration Passport
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
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    this.app.use(cors({
      origin: '*',
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
    }));
    
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'mon-session-secret-temp-12345',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      }
    }));

    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // 🔥 Servir les images statiques avec CORS
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
      setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Access-Control-Allow-Origin', '*');
      }
    }));
  }

  private initializeRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/books', bookRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/loans', loanRoutes);
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
