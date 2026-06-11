import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  define: {
    // Bake production API URL into build — used by getApiUrl() in App.tsx
    'import.meta.env.VITE_API_URL': JSON.stringify('https://balochi-bazar-backend.vercel.app'),
  },
});
