/* Copyright (c) 2017 YOPEY YOPEY LLC */

const Renderer = require('yy-renderer')

const View = {

    init: function(options)
    {
        options = options || {}
        View.renderer = new Renderer({ canvas: options.canvas })
        View.resize()
    },

    resize: function()
    {
        View.renderer.resize()
    },

    add: function(c)
    {
        return View.renderer.stage.addChild(c)
    },

    remove: function(child)
    {
        View.renderer.stage.removeChild(child)
    },

    clear()
    {
        View.renderer.stage.removeChildren()
    },

    render()
    {
        View.renderer.render()
    }
}

module.exports = View