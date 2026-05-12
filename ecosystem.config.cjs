const fs = require('fs');
const path = require('path');

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const raw of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const appDir = __dirname;
const envFromFile = loadDotenv(path.join(appDir, '.env'));

module.exports = {
  apps: [
    {
      name: 'journal-nordicuniversity',
      cwd: appDir,
      script: 'dist/journal-nordicuniversity-org/server/server.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ...envFromFile,
      },
      time: true,
    },
  ],
};
