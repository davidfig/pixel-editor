const Settings = require('./settings')

const RenderSheet = require(Settings.YY_RENDERSHEET)
const Color = require('yy-color')

const COLOR = 0x999999
const SIZE = 100

let _sheet, _transparent

function load(callback)
{
    createTransparentImage()
    _sheet = new RenderSheet()
    _sheet.add('transparency', draw, measure, SIZE)
    _sheet.render(callback)
}

function createTransparentImage()
{
    const size = 10
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const context = canvas.getContext('2d')
    draw(context, size)
    _transparent = 'url("' + canvas.toDataURL() + '")'
}

function convert(color)
{
    color = color.toString(16)
    while (color.length < 6)
    {
        color = '0' + color
    }
    return color
}

function draw(c, size)
{
    const half = size / 2
    const light = convert(Color.blend(0.75, 0xffffff, COLOR))
    c.fillStyle = '#' + light
    c.fillRect(0, 0, half, half)
    c.fillRect(half, half, half, half)
    c.fillStyle = '#' + convert(COLOR)
    c.fillRect(half, 0, half, half)
    c.fillRect(0, half, half, half)
}

function measure()
{
    return { width: SIZE, height: SIZE }
}

function get(name)
{
    return _sheet.get(name)
}

function getTexture(name)
{
    return _sheet.getTexture(name)
}

function render(callback)
{
    _sheet.once('render', callback)
    _sheet.render()
}

module.exports = {
    load,
    get,
    getTexture,
    render,
    get transparent()
    {
        return _transparent
    },
    get sheet()
    {
        return _sheet
    }
}