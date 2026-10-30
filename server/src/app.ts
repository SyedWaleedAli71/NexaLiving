import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({status: 'ok'}));
app.use('/api/auth', authRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({message: 'Route not found'});
});

// Central error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err);

  const anyErr = err as {name?: string; code?: number; message?: string};

  if (anyErr?.name === 'ValidationError') {
    res.status(422).json({message: anyErr.message});
    return;
  }
  // Duplicate key from Mongo unique index.
  if (anyErr?.code === 11000) {
    res.status(409).json({message: 'Resource already exists'});
    return;
  }

  res.status(500).json({message: 'Internal server error'});
});

export default app;
