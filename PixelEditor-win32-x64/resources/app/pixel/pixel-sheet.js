const Pixel = require('./pixel')

/**
 * sheet of pixels
 * @param {object[]} map
 * @param {string} map.name
 * @param {number} map.x
 * @param {number} map.y
 * @param {number} map.width
 * @param {number} map.height
 * @param {array} data - original data set to pull pixel from
 * @param {RenderSheet} sheet
 */
module.exports = function PixelSheet(map, data, sheet)
{
    for (let pixel of map)
    {
        pixel.frames = []
        pixel.frames[0] = { width: pixel.width, height: pixel.height, data: [] }
        for (let y = 0; y < pixel.height; y++)
        {
            for (let x = 0; x < pixel.width; x++)
            {
                pixel.frames[0].data[x + y * pixel.width] = data.frames[0].data[x + pixel.x + (y + pixel.y) * data.frames[0].width]
            }
        }
        Pixel.add(pixel, sheet)
    }
}