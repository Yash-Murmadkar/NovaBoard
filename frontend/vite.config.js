import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['fabric'], // Explicitly include Fabric.js
    exclude: ['js-big-decimal'] // Sometimes needed for Fabric.js
  },
  build: {
    commonjsOptions: {
      include: [/fabric/, /node_modules/] // Handle CJS dependencies
    }
  }
});