import {RequestHandler} from 'express';
import {ValidationChain, validationResult} from 'express-validator';

// Runs an array of express-validator chains and short-circuits with 422 on error.
export default function validate(chains: ValidationChain[]): RequestHandler[] {
  return [
    ...chains,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: (e as {path?: string}).path,
            message: e.msg,
          })),
        });
        return;
      }
      next();
    },
  ];
}
