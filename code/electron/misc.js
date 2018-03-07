const remote = require('electron').remote

module.exports = {
    toggleDevTools: () =>
    {
        remote.getCurrentWindow().toggleDevTools()
    }
}