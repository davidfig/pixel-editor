/* Copyright (c) 2017 YOPEY YOPEY LLC */

const Input = {

    touches: [],
    keys: {},
    input: [],

    init: function (div, handlers)
    {
        Input.handlers = handlers;
        div.addEventListener('mousedown', Input.mouseDown);
        div.addEventListener('mousemove', Input.mouseMove);
        div.addEventListener('mouseup', Input.mouseUp);
        div.addEventListener('mouseout', Input.mouseUp);

        div.addEventListener('touchstart', Input.touchStart);
        div.addEventListener('touchmove', Input.touchMove);
        div.addEventListener('touchend', Input.touchEnd);
        Input.keysListener();
    },

    /**
     * helper function to find touch from list based on id
     * @private
     * @param  {number} id for saved touch
     * @return {object}
     */
    findTouch: function (id)
    {
        for (let i = 0, _i = Input.touches.length; i < _i; i++)
        {
            if (Input.touches[i].identifier === id)
            {
                return Input.touches[i];
            }
        }
        return null;
    },

    /**
     * helper function to remove touch from touch list
     * @private
     * @param  {object} touch object
     */
    removeTouch: function (id)
    {
        for (let i = 0, _i = Input.touches.length; i < _i; i++)
        {
            if (Input.touches[i].identifier === id)
            {
                Input.touches.splice(i, 1);
                return;
            }
        }
    },

    /**
     * Handle touch start
     * @param  {object} e touch event
     */
    touchStart: function (e)
    {
        e.preventDefault();
        const touches = e.changedTouches;
        for (let i = 0, _i = touches.length; i < _i; i++)
        {
            const touch = touches[i];
            const entry = {
                identifier: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                start: Date.now()
            };
            Input.touches.push(entry);
            Input.handleDown(touch.clientX, touch.clientY);
        }
    },

    /**
     * Handle touch move
     * @param  {object} e touch event
     */
    touchMove: function (e)
    {
        e.preventDefault();
        for (let i = 0, _i = e.changedTouches.length; i < _i; i++)
        {
            const touch = e.changedTouches[i];
            Input.handleMove(touch.clientX, touch.clientY);
        }
    },

    /**
     * Handle touch end
     * @param  {object} e touch event
     */
    touchEnd: function (e)
    {
        e.preventDefault();
        for (let i = 0, _i = e.changedTouches.length; i < _i; i++)
        {
            const touch = e.changedTouches[i];
            const previous = Input.findTouch(touch.identifier);
            if (previous !== null)
            {
                Input.removeTouch(touch.identifier);
                Input.handleUp(touch.clientX, touch.clientY);
            }
        }
    },

    /**
     * Handle mouse down
     * @param  {object} e touch event
     */
    mouseDown: function (e)
    {
        e.preventDefault();
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX;
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY;
        Input.handleDown(x, y);
    },

    /**
     * Handle mouse move
     * @param  {object} e touch event
     */
    mouseMove: function (e)
    {
        e.preventDefault();
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX;
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY;
        Input.handleMove(x, y);
    },

    /**
     * Handle mouse up
     * @param  {object} e touch event
     */
    mouseUp: function (e)
    {
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX;
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY;
        Input.handleUp(x, y);
    },

    handleDown: function(x, y)
    {
        if (Input.handlers.down)
        {
            Input.handlers.down(x, y);
        }

    },

    handleUp: function(x, y)
    {
        if (Input.handlers.up)
        {
            Input.handlers.up(x, y);
        }
    },

    handleMove: function(x, y)
    {
        if (Input.handlers.move)
        {
            Input.handlers.move(x, y);
        }
    },

    /**
     * Sets event listener for keyboard
     */
    keysListener: function ()
    {
        document.addEventListener('keydown', Input.keydown);
        document.addEventListener('keyup', Input.keyup);
    },

    /**
     * @param  {object} e
     */
    keydown: function (e)
    {
        Input.keys.shift = e.shiftKey;
        Input.keys.meta = e.metaKey;
        Input.keys.ctrl = e.ctrlKey;
        const code = (typeof e.which === 'number') ? e.which : e.keyCode;
        if (Input.keys.meta && code === 73) return; // allow chrome to open developer console
        if (code === 82 && Input.keys.meta)
        { // reload page with meta + r
            window.location.reload();
            return;
        }
        console.log(code);
        if (Input.handlers.keyDown)
        {
            Input.handlers.keyDown(code);
        }
    },

    /**
     * Handle key up
     * @param  {object}
     */
    keyup: function (e)
    {
        Input.keys.shift = e.shiftKey;
        Input.keys.meta = e.metaKey;
        Input.keys.ctrl = e.ctrlKey;
        const code = (typeof e.which === 'number') ? e.which : e.keyCode;
        if (Input.handlers.keyUp)
        {
            Input.handlers.keyUp(code);
        }
    }
};

module.exports = Input;