/* Copyright (c) 2020 David Figatner */

import fs from 'fs-extra'
import esbuild from 'esbuild'
import express from 'express'

export async function bundler(port, debug) {
    await fs.emptyDir('dist')
    await esbuild.build({
        entryPoints: ['code/index.js'],
        bundle: true,
        outfile: 'dist/index.js',
        minify: !debug,
        sourcemap: debug,
    })
    await fs.copy('html/index.html', 'dist/index.html')
    await fs.copy('html/styles.css', 'dist/styles.css')
    const app = express()
    app.use(express.static('dist'))
    app.listen(port, () => console.log(`Pixel-Editor running at http://localhost:${port}`))
}