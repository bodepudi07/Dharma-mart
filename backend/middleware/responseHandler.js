export const standardResponse = (res, statusCode, data, message = '') => {
    res.status(statusCode).json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    });
};

export const errorResponse = (res, statusCode, message, errors = null) => {
    res.status(statusCode).json({
        success: false,
        error: message,
        details: errors,
        timestamp: new Date().toISOString()
    });
};
