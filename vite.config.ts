import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    vue(),
    glsl({
      include: [
        '**/*.glsl',
        '**/*.vert',
        '**/*.frag',
        '**/*.vs',
        '**/*.fs'
      ],
      exclude: undefined,
      defaultExtension: 'glsl',
      warnDuplicatedImports: true,
      throwOnWarning: false,
      compress: false
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './static')
    }
  },
  server: {
    port: 8080,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'vendor': ['vue', 'gsap', 'tweakpane']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'tweakpane']
  }
})
