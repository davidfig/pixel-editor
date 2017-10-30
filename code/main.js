const Renderer = require('yy-renderer')
const FontFaceObserver = require('fontfaceobserver')

const UI = require('../windows/ui')

const Toolbar = require('./toolbar')
const Palette = require('./palette')
const Picker = require('./picker')
const Sheet = require('./sheet')

let renderer, loading = 2

function afterLoad()
{
    loading--
    if (loading)
    {
        return
    }
    renderer = new Renderer({ debug: true })

    const ui = renderer.add(new UI())
    ui.addChild(new Toolbar())
    ui.addChild(new Palette())
    ui.addChild(new Picker())

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
}

const font = new FontFaceObserver('bitmap')
font.load().then(afterLoad)
Sheet.load(afterLoad)
