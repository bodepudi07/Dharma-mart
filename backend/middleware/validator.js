import { errorResponse } from './responseHandler.js';

export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return errorResponse(res, 400, 'Validation Error', errors);
        }
        next();
    };
};
