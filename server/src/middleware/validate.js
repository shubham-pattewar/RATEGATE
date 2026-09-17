import { ApiError } from '../utils/ApiError.js';

/**
 * Validates `req[source]` against a zod schema and replaces it with the parsed
 * (coerced, defaulted, stripped) value. Rejects with a 422 listing every issue.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.validation(issues));
    }
    req[source] = result.data;
    next();
  };
