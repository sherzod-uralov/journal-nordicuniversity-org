module.exports = {
  apps: [
    {
      name: 'journal-nordicuniversity',
      cwd: '/opt/apps/journal-nordicuniversity-org',
      script: 'dist/journal-nordicuniversity-org/server/server.mjs',
      node_args: '--experimental-global-webcrypto --env-file=/opt/apps/journal-nordicuniversity-org/.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/uni/.pm2/logs/journal-nordicuniversity-error.log',
      out_file: '/home/uni/.pm2/logs/journal-nordicuniversity-out.log',
      time: true,
    },
  ],
};
