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
      // Serve /data as static files in local development as a fallback
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
      // Custom plugin to serve the frontend public data directory at /data/*
      {
        name: 'serve-data-directory',
        configureServer(server) {
          server.middlewares.use('/data', (req, res, next) => {
            const dataDir = path.resolve(__dirname, './public/data');
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
      // API keys are now handled server-side only. Never expose secrets in the frontend bundle.
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            animations: ['framer-motion'],
          },
        },
      },
    },
  };
});