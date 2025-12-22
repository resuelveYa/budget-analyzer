module.exports = {
  apps: [{
    name: 'budget-analyzer',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3003,
    },

    // Logging
    error_file: '/var/www/logs/budget-analyzer-error.log',
    out_file: '/var/www/logs/budget-analyzer-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Restart policies
    max_memory_restart: '300M',
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
