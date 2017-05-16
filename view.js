/* Copyright (c) 2017 YOPEY YOPEY LLC */

const Animate = require('yy-animate');
const Renderer = require('yy-renderer');
const Update = require('yy-update');

const View = {

    init: function(update)
    {
        Update.init();
        if (update)
        {
            Animate.init({ update: Update });
            View.renderer = new Renderer({ update: Update });
            Update.update();
        }
        else
        {
            View.renderer = new Renderer();
        }
        View.resize();
    },

    resize: function()
    {
        View.renderer.resize();
    },

    add: function(c)
    {
        return View.renderer.stage.addChild(c);
    },

    remove: function(child)
    {
        View.renderer.stage.removeChild(child);
    },

    clear()
    {
        View.renderer.stage.removeChildren();
    },

    dirty()
    {
        View.renderer.dirty = true;
    },

    render()
    {
        View.renderer.render();
    }
};

module.exports = View;