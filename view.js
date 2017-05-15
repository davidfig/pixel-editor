/* Copyright (c) 2017 YOPEY YOPEY LLC */

const Animate = require('yy-animate');
const Renderer = require('yy-renderer');
const Update = require('yy-update');

const View = {

    init: function()
    {
        Update.init();
        Animate.init({update: Update});
        View.renderer = new Renderer({color: 0xffffff, update: Update});
        View.resize();
        Update.update();
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
    }
};

module.exports = View;