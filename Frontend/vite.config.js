import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// The `shared/` directory sits next to the frontend rather than inside it,
// so the CommonJS backend and this Vite app can import the same website
// schema, template registry and theme presets. Vite needs to be told it may
// read files from there.
const sharedDir = fileURLToPath(new URL('../shared', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Without this, Vite silently falls back to 5174 (and so on) when 5173
    // is taken, which leaves the browser hitting an origin the backend's
    // CORS allowlist does not know about. Failing loudly is much easier to
    // diagnose than a CORS error.
    strictPort: true,
    fs: {
      allow: ['..', sharedDir],
    },
  },
  build: {
    // The shared modules are outside the frontend root but are part of the
    // project, so they are compiled into the bundle rather than copied.
    rollupOptions: {},
  },
})
