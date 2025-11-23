import compression from 'compression';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config, generalLimiter, logger, stream } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // Response compression
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }));

    // General rate limiting middleware, applied to all requests
    this.app.use(generalLimiter);

    // Logging middleware
    this.app.use(morgan('combined', { stream }));

    // Body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    // Apply session tracking middleware globally
    this.app.use(config.API_PREFIX, routes);

    // 404 route handler
    this.app.use((req: Request, res: Response) => {
      logger.warn(`404 - Not Found - ${req.originalUrl} - Method: ${req.method} - IP: ${req.ip}`);
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
