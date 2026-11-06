module.exports = {
  apps: [
    {
      name: 'checklist-thanh-hai',
      script: 'src/server.js',
      // Dùng fork mode để SQLite WAL hoạt động ổn định nhất
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: './data/checklist.db'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
