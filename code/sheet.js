import RenderSheet from 'yy-rendersheet'
import Color from 'yy-color'

const COLOR = 0x999999
const SIZE = 100

let _transparent

export const sheet = new RenderSheet()

export async function createSheet()
{
    createTransparentImage()
    sheet.add('transparency', draw, measure, SIZE)
    await sheet.asyncRender()
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

export function getTransparent()
{
    return _transparent
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