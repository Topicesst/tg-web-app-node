module.exports = {
    apps : [{
        name: 'web-app-bot',
        script: 'index.js', // Ваш головний скрипт
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
