import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { isProd } from '../config/env';
import multer from 'multer';
import { logger } from '../utils/logger';
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let status = 500; let code = 'INTERNAL_ERROR'; let message = 'Internal server error'; let details: any;
  if (err instanceof ApiError) { status = err.statusCode; code = err.code; message = err.message; details = err.details; }
  else if (err instanceof ZodError) { status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid request'; details = err.errors.map((i) => ({ path: i.path.join('.'), message: i.message })); }
  else if (err instanceof mongoose.Error.CastError) { status = 404; code = 'NOT_FOUND'; message = 'Not found'; }
  else if (err?.code === 11000) { status = 409; code = 'CONFLICT'; message = 'Duplicate value'; }
  else if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err)) {
    status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON in request body';
  }
  else if (err?.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body too large';
  }
  else if (typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
    status = err.statusCode; code = err.code || 'ERROR'; message = err.message || 'Request error';
  }
  else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = err.code === 'LIMIT_FILE_SIZE' ? 'PAYLOAD_TOO_LARGE' : 'VALIDATION_ERROR';
    message = err.message;
  }
  if (status >= 500 && isProd) message = 'Internal server error';
  if (status >= 500) logger.error({ err }, 'Unhandled error');
  res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
}