/* Copyright (c) 2020 David Figatner */

const fs = require('fs-extra')
const Bundler = require('parcel-bundler')
const path = require('path')

const entryFiles = path.join('html', 'index.html')

const options = {
    outDir: 'dist', // The out directory to put the build files in, defaults to dist
    publicUrl: '/', // The url to serve on, defaults to '/'
    watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
    cache: true, // Enabled or disables caching, defaults to true
    minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
    hmr: false, // Enable or disable HMR while watching
    sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
    autoInstall: false, // Enable or disable auto install of missing dependencies found during bundling,
}

const optionsRelease = {
    ...options,
    watch: false, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
    minify: true, // Minify files, enabled if process.env.NODE_ENV === 'production'
}

module.exports = async function parcel(port, debug)
{
    await fs.emptyDir(options.outDir)
    const bundler = new Bundler(entryFiles, debug ? options : optionsRelease)
    await bundler.serve(port)
}