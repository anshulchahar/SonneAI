// deployment.config.mjs
export default {
    csp: {
        enabled: true,
        directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https://lh3.googleusercontent.com', 'https://authjs.dev'],
            'font-src': ["'self'"],
            'object-src': ["'none'"],
            'connect-src': ["'self'", 'https://api.emailjs.com'], // Added EmailJS API endpoint
        },
    },
};
