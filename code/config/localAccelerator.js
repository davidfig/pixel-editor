const LocalAccelerator = {

    init: function ()
    {
        if (!LocalAccelerator.keys)
        {
            LocalAccelerator.keys = {}
            document.body.addEventListener('keydown', LocalAccelerator.keyDown)
        }
    },

    /**
     * clear all user-registered keys
     */
    clearKeys: function ()
    {
        LocalAccelerator.keys = {}
    },

    /**
     * Keycodes definition. In the form of modifier[+modifier...]+key
     * <p>For example: ctrl+shift+e</p>
     * <p>KeyCodes are case insensitive (i.e., shift+a is the same as Shift+A). And spaces are removed</p>
     * <p>You can assign more than one key to the same shortcut by using a | between the keys (e.g., 'shift+a | ctrl+a')</p>
     * <pre>
     * Modifiers:
     *    ctrl, alt, shift, meta, (ctrl aliases: command, control, commandorcontrol)
     * </pre>
     * <pre>
     * Keys:
     *    escape, 0-9, minus, equal, backspace, tab, a-z, backetleft, bracketright, semicolon, quote,
     *    backquote, backslash, comma, period, slash, numpadmultiply, space, capslock, f1-f24, pause,
     *    scrolllock, printscreen, home, arrowup, arrowleft, arrowright, arrowdown, pageup, pagedown,
     *    end, insert, delete, enter, shiftleft, shiftright, ctrlleft, ctrlright, altleft, altright, shiftleft,
     *    shiftright, numlock, numpad...
     * </pre>
     * For OS-specific codes and a more detailed explanation see {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code}. Also note that 'Digit' and 'Key' are removed from the code to make it easier to type.
     *
     * @typedef {string} LocalAccelerator~KeyCodes
     */

    /**
     * translate a user-provided keycode
     * @param {KeyCodes} keyCode
     * @return {KeyCodes} formatted and sorted keyCode
     * @private
     */
    prepareKey: function (keyCode)
    {
        const keys = []
        let split
        if (keyCode.indexOf('|') !== -1)
        {
            split = keyCode.split('|')
        }
        else
        {
            split = [keyCode]
        }
        for (let code of split)
        {
            let key = ''
            let modifiers = []
            code = code.toLowerCase().replace(' ', '')
            if (code.indexOf('+') !== -1)
            {
                const split = code.split('+')
                for (let i = 0; i < split.length - 1; i++)
                {
                    let modifier = split[i]
                    modifier = modifier.replace('commandorcontrol', 'ctrl')
                    modifier = modifier.replace('command', 'ctrl')
                    modifier = modifier.replace('control', 'ctrl')
                    modifiers.push(modifier)
                }
                modifiers = modifiers.sort((a, b) => { return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0 })
                for (let part of modifiers)
                {
                    key += part + '+'
                }
                key += split[split.length - 1]
            }
            else
            {
                key = code
            }
            keys.push(key)
        }
        return keys
    },

    /**
     * register a key as a global accelerator
     * @param {KeyCodes} keyCode (e.g., Ctrl+shift+E)
     * @param {function} callback
     */
    register: function (keyCode, callback)
    {
        LocalAccelerator.init()
        const keys = LocalAccelerator.prepareKey(keyCode)
        for (let key of keys)
        {
            LocalAccelerator.keys[key] = (e) =>
            {
                callback(e)
                e.preventDefault()
                e.stopPropagation()
            }
        }
    },

    keyDown: function (e, event)
    {
        const modifiers = []
        if (e.altKey)
        {
            modifiers.push('alt')
        }
        if (e.ctrlKey)
        {
            modifiers.push('ctrl')
        }
        if (e.metaKey)
        {
            modifiers.push('meta')
        }
        if (e.shiftKey)
        {
            modifiers.push('shift')
        }
        let keyCode = ''
        for (let modifier of modifiers)
        {
            keyCode = modifier + '+'
        }
        let translate = e.code.toLowerCase()
        translate = translate.replace('digit', '')
        translate = translate.replace('key', '')
        keyCode += translate
        if (LocalAccelerator.keys[keyCode])
        {
            LocalAccelerator.keys[keyCode](e, LocalAccelerator)
        }
    }
}

module.exports = LocalAccelerator