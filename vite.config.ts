import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: { outDir: 'dist' },
    test: { environment: 'node' },
})
