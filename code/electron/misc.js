const remote = require('electron').remote
const Menu = remote.Menu
const MenuItem = remote.MenuItem

module.exports = {

    Menu,
    MenuItem,

    toggleDevTools: () => remote.getCurrentWindow().toggleDevTools(),

    quit: () => remote.app.quit(),

    isElectron: true
}