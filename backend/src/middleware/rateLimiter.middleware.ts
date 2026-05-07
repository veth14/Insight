import rateLimit from 'express-rate-limit';

// Global API Rate Limiting
// Limits general traffic to prevent excessive requesting to the server
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes."
    }
});

// Stricter Rate Limiting for Auth routes
// Limits brute-force login attacks, excessive registration spam, or OTP requests
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10000, // Increased for presentation testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many authentication attempts from this IP, please try again after an hour."
    }
});
