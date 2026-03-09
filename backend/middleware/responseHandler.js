export const standardResponse = (res, statusCode, data, message = '') => {
    res.status(statusCode).json({
        success: true,
        data,
        message
    });
};

export const errorResponse = (res, statusCode, message, errors = null) => {
    res.status(statusCode).json({
        success: false,
        error: message,
        details: errors
    });
};
