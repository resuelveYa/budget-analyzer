module.exports = {
  apps: [{
    name: 'saerti-budget',
    script: './.next/standalone/server.js',
    instances: 1,
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },

    // Logging
    error_file: '/var/www/logs/saerti-budget-error.log',
    out_file: '/var/www/logs/saerti-budget-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Restart policies
    max_memory_restart: '400M',
    exp_backoff_restart_delay: 100,
    restart_delay: 4000,

    // Advanced features
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git', '.next'],

    // Auto restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
  }]
};
