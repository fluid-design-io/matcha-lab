import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import typegpuPlugin from 'unplugin-typegpu/vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Defensive. A stale dep-optimizer cache produced "Invalid hook call" the first time
    // motion/react was added; clearing node_modules/.vite fixed it, and these keep the single
    // React instance explicit so it cannot come back.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: { include: ['motion', 'motion/react'] },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart({
      // A home-screen app should behave as a standalone shell rather than round-tripping a
      // server on every launch. The shell prerenders once; everything after that is client-side.
      spa: { enabled: true },
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
    typegpuPlugin(),
  ],
})

export default config
