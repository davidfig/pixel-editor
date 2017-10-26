/* Copyright (c) 2017 YOPEY YOPEY LLC */

// Note: these algorithms are WOEFULLY inefficient. They are designed for low-resolution pixel drawings that are rendered to a spritesheet.
// Please do NOT use these where you want to render shapes during each frame

let _c, _scale = 1

function put(x, y)
{
    _c.beginPath()
    _c.fillRect(Math.round(x), Math.round(y), 1, 1)
}

function box(x1, y1, w, h)
{
    _c.beginPath()
    _c.fillRect(Math.round(x1), Math.round(y1), Math.round(w), Math.round(h))
}

function mod(n, m)
{
    return ((n % m) + m) % m
}

const PixelArt = {

    get scale()
    {
        return _scale
    },

    set scale(value)
    {
        _scale = value
    },

    put: function (x, y, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        put(x * _scale, y * _scale)
    },

    points: function (points, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        for (let i = 0; i < points.length; i += 2)
        {
            put(points[i] * _scale, points[i + 1] * _scale)
        }
    },

    rectFill: function (x1, y1, w, h, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        box(x1 * _scale, y1 * _scale, w * _scale, h * _scale)
    },

    // from https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
    circle: function (x0, y0, radius, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        x0 *= _scale
        y0 *= _scale
        radius *= _scale
        let x = radius
        let y = 0
        let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

        while (x >= y)
        {
            put(x + x0, y + y0)
            put(y + x0, x + y0)
            put(-x + x0, y + y0)
            put(-y + x0, x + y0)
            put(-x + x0, -y + y0)
            put(-y + x0, -x + y0)
            put(x + x0, -y + y0)
            put(y + x0, -x + y0)
            y++
            if (decisionOver2 <= 0)
            {
                decisionOver2 += 2 * y + 1 // Change in decision criterion for y -> y+1
            } else
            {
                x--
                decisionOver2 += 2 * (y - x) + 1 // Change for y -> y+1, x -> x-1
            }
        }
    },

    arc: function (x0, y0, radius, start, end, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        x0 *= _scale
        y0 *= _scale
        radius *= _scale
        const interval = Math.PI / radius / 4
        for (let i = start; i <= end; i += interval)
        {
            put(x0 + Math.cos(i) * radius, y0 + Math.sin(i) * radius)
        }
    },

    circleFill: function (x0, y0, radius, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        x0 *= _scale
        y0 *= _scale
        radius *= _scale
        let x = radius
        let y = 0
        let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

        while (x >= y)
        {
            box(-x + x0, y + y0, x * 2, 1)
            box(-y + x0, x + y0, y * 2, 1)
            box(-x + x0, -y + y0, x * 2, 1)
            box(-y + x0, -x + y0, y * 2, 1)
            y++
            if (decisionOver2 <= 0)
            {
                decisionOver2 += 2 * y + 1 // Change in decision criterion for y -> y+1
            } else
            {
                x--
                decisionOver2 += 2 * (y - x) + 1 // Change for y -> y+1, x -> x-1
            }
        }
    },

    // from http://cfetch.blogspot.tw/2014/01/wap-to-draw-ellipse-using-midpoint.html
    ellipse(xc, yc, rx, ry, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        xc *= _scale
        yc *= _scale
        rx *= _scale
        ry *= _scale
        let x = 0, y = ry
        let p = (ry * ry) - (rx * rx * ry) + ((rx * rx) / 4)
        while ((2 * x * ry * ry) < (2 * y * rx * rx))
        {
            put(xc + x, yc - y)
            put(xc - x, yc + y)
            put(xc + x, yc + y)
            put(xc - x, yc - y)

            if (p < 0)
            {
                x = x + 1
                p = p + (2 * ry * ry * x) + (ry * ry)
            }
            else
            {
                x = x + 1
                y = y - 1
                p = p + (2 * ry * ry * x + ry * ry) - (2 * rx * rx * y)
            }
        }
        p = (x + 0.5) * (x + 0.5) * ry * ry + (y - 1) * (y - 1) * rx * rx - rx * rx * ry * ry
        while (y >= 0)
        {
            put(xc + x, yc - y)
            put(xc - x, yc + y)
            put(xc + x, yc + y)
            put(xc - x, yc - y)
            if (p > 0)
            {
                y = y - 1
                p = p - (2 * rx * rx * y) + (rx * rx)
            }
            else
            {
                y = y - 1
                x = x + 1
                p = p + (2 * ry * ry * x) - (2 * rx * rx * y) - (rx * rx)
            }
        }
    },

    ellipseFill(xc, yc, rx, ry, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        xc *= _scale
        yc *= _scale
        rx *= _scale
        ry *= _scale
        let x = 0, y = ry
        let p = (ry * ry) - (rx * rx * ry) + ((rx * rx) / 4)
        while ((2 * x * ry * ry) < (2 * y * rx * rx))
        {
            box(xc - x, yc - y, x * 2, 1)
            box(xc - x, yc + y, x * 2, 1)
            if (p < 0)
            {
                x = x + 1
                p = p + (2 * ry * ry * x) + (ry * ry)
            }
            else
            {
                x = x + 1
                y = y - 1
                p = p + (2 * ry * ry * x + ry * ry) - (2 * rx * rx * y)
            }
        }
        p = (x + 0.5) * (x + 0.5) * ry * ry + (y - 1) * (y - 1) * rx * rx - rx * rx * ry * ry
        while (y >= 0)
        {
            box(xc - x, yc - y, x * 2, 1)
            box(xc - x, yc + y, x * 2, 1)
            if (p > 0)
            {
                y = y - 1
                p = p - (2 * rx * rx * y) + (rx * rx)
            }
            else
            {
                y = y - 1
                x = x + 1
                p = p + (2 * ry * ry * x) - (2 * rx * rx * y) - (rx * rx)
            }
        }
    },

    polygonFill: function (vertices, color, c)
    {
        _c = c || _c
        if (color)
        {
            _c.fillStyle = color
        }
        const edges = [], active = []
        let minY = Infinity, maxY = 0

        // create edges
        for (let i = 0; i < vertices.length; i += 2)
        {
            const p1 = { x: vertices[i] * _scale, y: vertices[i + 1] * _scale }
            const p2 = { x: vertices[mod(i + 2, vertices.length)] * _scale, y: vertices[mod(i + 3, vertices.length)] * _scale }
            if (p1.y - p2.y !== 0)
            {
                const edge = {}
                edge.p1 = p1
                edge.p2 = p2
                if (p1.y < p2.y)
                {
                    edge.minY = p1.y
                    edge.minX = p1.x
                }
                else
                {
                    edge.minY = p2.y
                    edge.minX = p2.x
                }
                minY = (edge.minY < minY) ? edge.minY : minY
                edge.maxY = Math.max(p1.y, p2.y)
                maxY = (edge.maxY > maxY) ? edge.maxY : maxY
                if (p1.x - p2.x === 0)
                {
                    edge.slope = Infinity
                    edge.b = p1.x
                }
                else
                {
                    edge.slope = (p1.y - p2.y) / (p1.x - p2.x)
                    edge.b = p1.y - edge.slope * p1.x
                }
                edges.push(edge)
            }
        }
        edges.sort((a, b) => { return a.minY - b.minY; })
        for (let y = minY; y <= maxY; y++)
        {
            for (let i = 0; i < edges.length; i++)
            {
                const edge = edges[i]
                if (edge.minY === y)
                {
                    active.push(edge)
                    edges.splice(i, 1)
                    i--
                }
            }
            for (let i = 0; i < active.length; i++)
            {
                const edge = active[i]
                if (edge.maxY < y)
                {
                    active.splice(i, 1)
                    i--
                }
                else
                {
                    if (edge.slope !== Infinity)
                    {
                        edge.x = Math.round((y - edge.b) / edge.slope)
                    }
                    else
                    {
                        edge.x = edge.b
                    }
                }
            }
            active.sort((a, b) => { return a.x - b.x === 0 ? b.maxY - a.maxY : a.x - b.x; })
            let bit = true, current = 1
            for (let x = active[0].x; x <= active[active.length - 1].x; x++)
            {
                if (bit)
                {
                    put(x, y)
                }
                if (active[current].x === x)
                {
                    if (active[current].maxY !== y)
                    {
                        bit = !bit
                    }
                    current++
                }
            }
        }
    }
}

module.exports = PixelArt