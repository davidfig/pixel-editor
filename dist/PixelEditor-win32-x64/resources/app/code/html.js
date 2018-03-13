module.exports = function (options)
{
    options = options || {}
    const object = document.createElement(options.type || 'div')
    if (options.parent)
    {
        options.parent.appendChild(object)
    }
    if (options.styles)
    {
        for (let style in options.styles)
        {
            object.style[style] = options.styles[style]
        }
    }
    if (options.html)
    {
        object.innerHTML = options.html
    }
    if (options.list)
    {
        object.setAttribute('list', options.list)
    }
    if (options.Type)
    {
        object.setAttribute('type', options.Type)
    }
    const covered = ['parent', 'styles', 'html', 'type', 'Type', 'list']
    for (let item in options)
    {
        if (covered.indexOf(item) === -1)
        {
            object[item] = options[item]
        }
    }
    return object
}