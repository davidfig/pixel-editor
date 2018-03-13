const remote = require('electron').remote
// const Menu = remote.Menu
// const MenuItem = remote.MenuItem

const Menu = require('yy-menu')
const MenuItem = Menu.MenuItem

module.exports = {

    Menu,
    MenuItem,

    toggleDevTools: () => remote.getCurrentWindow().toggleDevTools(),

    quit: () => remote.app.quit(),

    isElectron: true
}