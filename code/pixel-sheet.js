const Settings = require('./settings')

const RenderSheet = require(Settings.YY_RENDERSHEET)
const PIXI = require('pixi.js')

module.exports = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST, useSimplePacker: true })