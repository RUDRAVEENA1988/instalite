const express = require('express');
const path = require('path');
const fs = require('fs');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !match[1].startsWith('#') && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

loadEnvFile();

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));
app.get('/api/config', (request, response) => {
  // Reload on request so adding or changing .env does not require a stale
  // process restart during local development.
  loadEnvFile();
  response.set('Cache-Control', 'no-store');
  response.json({
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`InstaLite is running at http://localhost:${port}`);
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('Supabase environment is missing. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.');
    }
  });
}

module.exports = app;
