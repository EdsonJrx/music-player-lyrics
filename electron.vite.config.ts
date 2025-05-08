import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  /* ------------ MAIN (processo principal) ------------ */
  main: {
    plugins: [
      externalizeDepsPlugin(),

      // Copia artefatos nativos para resources/
      viteStaticCopy({
        targets: [
          { src: 'src/main/native/build/Release/addon.node', dest: '.' },
          { src: 'resources/libwnp.dll', dest: '.' },
          { src: 'resources/tray.png', dest: '' }
        ]
      })
    ],
    resolve: {
      alias: {
        '@/lib': resolve('src/main/lib'),
        '@/shared': resolve('src/shared')
      }
    },
    build: {
      outDir: 'out/main',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve('src/main/index.ts'), // entrada padrão
        output: { entryFileNames: 'index.js' } // gera out/main/index.js
      }
    }
  },

  /* ------------ PRELOAD ------------ */
  preload: {
    plugins: [externalizeDepsPlugin()]
  },

  /* ------------ RENDERER ------------ */
  renderer: {
    assetsInclude: 'src/renderer/assets/**',
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@/hooks': resolve('src/renderer/src/hooks'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/store': resolve('src/renderer/src/store'),
        '@/components': resolve('src/renderer/src/components'),
        '@/mocks': resolve('src/renderer/src/mocks')
      }
    }
  }
})
