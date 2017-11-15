function init(w)
{
    w.on('show', place, w)
}

function place(w)
{
    const pos = w.getContentBounds()()
    if (pos.x < 0)
    {
        pos.x = 0
    }
    if (pos.y < 0)
    {
        pos.y = 0
    }
    if (pos.x + pos.width > window.innerWidth)
    {
        if (window.innerWidth - (pos.x + pos.width) >= 0)
        {
            pos.x = window.innerWidth - (pos.x + pos.width)
        }
        else
        {
            pos.x = 0
            pos.width = window.innerWidth
        }
    }
    if (pos.y + pos.height > window.innerHeight)
    {
        if (window.innerHeight - (pos.y - pos.height) >= 0)
        {
            pos.y = window.innerHeight - (pos.y + pos.height)
        }
        else
        {
            pos.y = 0
            pos.height = window.innerHeight
        }
    }
    w.setContentBounds(pos)
}

module.exports = {
    init,
    place
}