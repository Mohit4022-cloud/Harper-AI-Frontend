module.exports = {
  apps: [
    {
      name: 'harper-ai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      
      // Advanced features
      min_uptime: '10s',
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Health check
      health_check: {
        interval: 30000,
        timeout: 5000,
        path: '/api/health',
        max_consecutive_failures: 3
      }
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/harper-ai-frontend.git',
      path: '/var/www/harper-ai',
      'pre-deploy-local': 'npm run build',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/staging',
      repo: 'git@github.com:your-username/harper-ai-frontend.git',
      path: '/var/www/harper-ai-staging',
      'pre-deploy-local': 'npm run build',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
}