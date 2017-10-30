const RenderSheet = require('yy-rendersheet')
const Color = require('yy-color')

const SIZE = 100

const GRAY = '#dddddd'

const IMAGES = ['select', 'pen', 'paint']

let _sheet, _transparent

function load(callback)
{
    _sheet = new RenderSheet()
    _transparent = GRAY
    _sheet.add('transparency', draw, measure)
    for (let image of IMAGES)
    {
        _sheet.addImage(image, '../images/' + image + '.png')
    }
    _sheet.render(callback)
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
    const light = convert(Color.blend(0.5, 0xffffff, _transparent));
    c.fillStyle = '#' + light
    c.fillRect(0, 0, half, half)
    c.fillRect(half, half, half, half)
    c.fillStyle = '#' + convert(_transparent)
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
    set transparent(value)
    {
        _transparent = value
    }
}