import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
        if (!obj) return obj;
        if (typeof obj === 'string') {
            return sanitizeHtml(obj, {
                allowedTags: [], // Strip all HTML tags
                allowedAttributes: {}
            });
        }
        if (Array.isArray(obj)) {
            return obj.map(item => sanitize(item));
        }
        if (typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                obj[key] = sanitize(obj[key]);
            });
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);

    next();
};
