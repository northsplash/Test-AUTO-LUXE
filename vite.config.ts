import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function jobApplicationApi(): Plugin {
  return {
    name: 'job-application-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/job-application')) return next();
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          try {
            const { default: handler } = await import('./api/job-application');
            const request = new Request(`http://127.0.0.1${req.url}`, {
              method: req.method || 'GET',
              headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
              body: req.method && req.method !== 'GET' && req.method !== 'HEAD' ? Buffer.concat(chunks) : undefined,
            });
            const response = await handler(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Apply API failed.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [react(), jobApplicationApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 43128,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 43128,
      strictPort: true,
    },
  };
});
