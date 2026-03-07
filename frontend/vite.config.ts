import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Serve /data folder as static files so the app works without starting the backend server
      middlewareMode: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      // Custom plugin to serve the /data directory as static files at /data/*
      {
        name: 'serve-data-directory',
        configureServer(server) {
          server.middlewares.use('/data', (req, res, next) => {
            const dataDir = path.resolve(__dirname, '../data');
            const filePath = path.join(dataDir, req.url || '');

            // Security: ensure we don't escape the data directory
            if (!filePath.startsWith(dataDir)) {
              res.statusCode = 403;
              res.end('Forbidden');
              return;
            }

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const content = fs.readFileSync(filePath);
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes: Record<string, string> = {
                '.json': 'application/json',
                '.txt': 'text/plain',
                '.html': 'text/html',
              };
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.end(content);
            } else {
              res.statusCode = 404;
              res.end('Not Found');
            }
          });
        },
      },
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});