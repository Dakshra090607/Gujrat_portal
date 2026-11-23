import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const clientDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(clientDirectory, '..');

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '');
  const apiPort = Number(process.env.BUILDRULE_API_PORT ?? environment.BUILDRULE_API_PORT ?? 4000);
  const neonAuthUrl =
    environment.VITE_NEON_AUTH_URL ||
    environment.NEON_AUTH_BASE_URL ||
    process.env.VITE_NEON_AUTH_URL ||
    process.env.NEON_AUTH_BASE_URL ||
    '';

  return {
    root: clientDirectory,
    envDir: projectRoot,
    define: {
      'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(neonAuthUrl),
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(process.env.BUILDRULE_CLIENT_PORT ?? environment.BUILDRULE_CLIENT_PORT ?? 5173),
      strictPort: false,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
