import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// User/organisation page — served from root, no base path needed.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
