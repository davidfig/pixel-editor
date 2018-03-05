/* Copyright (c) 2018 YOPEY YOPEY LLC */

// const Tooltip = require('yy-tooltip')
const Tooltip = require('../../components/tooltip')

const html = require('./html')

module.exports = function button(parent, data, styles, title)
{
    const scale = 2

    const button = html({ parent, type: 'button', styles: { position: 'relative' } })
    if (title)
    {
        if (Array.isArray(title))
        {
            new Tooltip(button, '<div>' + title[0] + '</div><div>key: ' + title[1] + '</div>')
        }
        else
        {
            new Tooltip(button, title)
        }
    }
    const image = new Image()
    image.src = 'data:image/png;base64,' + data[2]
    image.width = data[0] * scale
    button.style.width = image.width * 1.5 + 'px'
    image.height = data[1] * scale
    button.style.height = image.height * 1.5 + 'px'
    image.style.imageRendering = 'pixelated'
    image.style.position = 'absolute'
    image.style.top = '50%'
    image.style.left = '50%'
    image.style.transform = 'translate(-50%, -50%)'
    image.style.pointerEvents = 'none'
    button.image = image
    button.appendChild(image)
    if (styles)
    {
        for (let key in styles)
        {
            button.style[key] = styles[key]
        }
    }
    return button
}