const Renderer = require('yy-renderer')
const FontFaceObserver = require('fontfaceobserver')
const Input = require('yy-input')
const remote = require('electron').remote

const UI = require('../windows/ui')
const Toolbar = require('./toolbar')
const Palette = require('./palette')
const Picker = require('./picker')
const Coords = require('./coords')
const Sheet = require('./sheet')
const Draw = require('./draw')
const State = require('./state')
const Menu = require('./menu')

let renderer, ui, input, loading = 2

function afterLoad()
{
    loading--
    if (loading)
    {
        return
    }

    renderer = new Renderer({ debug: true, autoresize: true })
    ui = renderer.add(new UI())
    ui.addChild(new Draw())
    ui.addChild(new Toolbar())
    ui.addChild(new Palette())
    ui.addChild(new Picker())
    ui.addChild(new Coords())

    input = new Input({ noPointers: true })
    input.on('keyup', keyup)
    renderer.interval(
        function (elapsed)
        {
            if (ui.update(elapsed))
            {
                renderer.dirty = true
            }
        }
    )
    renderer.start()

    Menu()
}

function keyup(code, special)
{
    if (ui.editing)
    {
        return
    }
    this.shift = special.shift
    if (special.ctrl && code >= 48 && code <= 57)
    {
        let i = code === 48 ? 10 : code - 48
        if (i < State.lastFiles.length)
        {
            // load([State.lastFiles[i]])
            return
        }
    }
    if (special.ctrl && special.shift && code === 68)
    {
        State.createDefaults()
        return
    }
    if (special.ctrl)
    {
        switch (code)
        {
            case 81:
                remote.app.quit()
                break
            case 83:
                File.saveFile()
                break
            case 79:
                File.openFile()
                break
            case 78:
                File.newFile()
                break
        }
    }
}

function isEditing()
{
    return ui.editing
}


module.exports = {
    isEditing
}

const font = new FontFaceObserver('bitmap')
font.load().then(afterLoad)
Sheet.load(afterLoad)
