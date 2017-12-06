const Settings = require('./settings')

const RenderSheet = require(Settings.YY_RENDERSHEET)
const Color = require('yy-color')

const State = require('./state')

const SIZE = 100

let _sheet

function load(callback)
{
    _sheet = new RenderSheet()
    _sheet.add('transparency', draw, measure)
    _sheet.render(callback)
    State.on('transparentColor', () => _sheet.render())
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

function draw(c)
{
    const half = SIZE / 2
    const light = convert(Color.blend(0.5, 0xffffff, State.transparentColor))
    c.fillStyle = '#' + light
    c.fillRect(0, 0, half, half)
    c.fillRect(half, half, half, half)
    c.fillStyle = '#' + convert(State.transparentColor)
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

function render()
{
    _sheet.render()
}

module.exports = {
    load,
    get,
    getTexture,
    render,
    get sheet()
    {
        return _sheet
    }
}