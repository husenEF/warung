module.exports = {
  apps: [
    {
      name: 'warung-telegram-bot',
      script: 'server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 4000,
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
