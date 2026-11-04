import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
export function validate(s: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (s.params) req.params = s.params.parse(req.params) as any;
      if (s.query) { const parsed = s.query.parse(req.query); Object.assign(req.query, parsed); }
      if (s.body) req.body = s.body.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const details = e.errors.map((i) => ({ path: i.path.join('.'), message: i.message }));
        return next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', details));
      }
      next(e);
    }
  };
}