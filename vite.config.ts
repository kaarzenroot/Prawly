import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// ── Dev-only middleware that proxies /api/prawlly to the serverless function logic ──
// In production on Vercel, the /api directory is served as serverless functions automatically.
function devApiPlugin() {
  return {
    name: 'dev-api-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/prawlly', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', async () => {
          try {
            // Dynamically import and run the serverless handler with a mock req/res
            const { message } = JSON.parse(body);
            if (!message || typeof message !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing or invalid "message" field' }));
              return;
            }

            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            if (!GEMINI_API_KEY) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set in .env.local' }));
              return;
            }

            // Forward to the actual serverless function handler
            const mod = await import('./api/prawlly.ts');
            const mockReq = { method: 'POST', body: { message } };
            const mockRes = {
              statusCode: 200,
              _headers: {} as Record<string, string>,
              _body: '',
              status(code: number) { this.statusCode = code; return this; },
              json(data: any) { this._body = JSON.stringify(data); return this; },
              setHeader(k: string, v: string) { this._headers[k] = v; return this; },
            };

            await mod.default(mockReq as any, mockRes as any);

            res.statusCode = mockRes.statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(mockRes._body);
          } catch (err: any) {
            console.error('Dev API proxy error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Dev proxy error', detail: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-motion': ['motion'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
