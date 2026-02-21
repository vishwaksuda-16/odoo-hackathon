export const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            code: 'DUPLICATE_ENTRY',
            reason: err.detail ?? 'A record with this value already exists.',
        });
    }
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            code: 'FOREIGN_KEY_VIOLATION',
            reason: err.detail ?? 'Referenced record does not exist.',
        });
    }
    if (err.code === '23514') {
        return res.status(400).json({
            success: false,
            code: 'CHECK_VIOLATION',
            reason: err.detail ?? 'Data constraint violated.',
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, code: 'INVALID_TOKEN', reason: err.message });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', reason: 'Access token expired.' });
    }

    if (err.message?.startsWith('ILLEGAL_')) {
        return res.status(409).json({ success: false, code: 'ILLEGAL_STATE_TRANSITION', reason: err.message });
    }

    const statusCode = err.status ?? err.statusCode ?? 500;
    return res.status(statusCode).json({
        success: false,
        code: 'INTERNAL_ERROR',
        reason: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    });
};
