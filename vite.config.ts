import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Served from https://ofloody.github.io/playing-cards/ — assets must be
  // referenced under that subpath, not the domain root.
  base: '/playing-cards/',
  plugins: [react(), tailwindcss()],
});
