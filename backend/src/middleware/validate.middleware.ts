import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

interface RequestValidationTargets {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schemas: RequestValidationTargets) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as unknown as Request['params'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || 'root';
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }
        next(
          new AppError(
            'Validation failed for incoming request data.',
            400,
            'VALIDATION_ERROR',
            details
          )
        );
      } else {
        next(error);
      }
    }
  };
}
