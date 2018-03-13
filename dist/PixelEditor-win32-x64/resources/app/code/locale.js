const LANGUAGES = {
    'en-us': require('../data/text/en-us.json')
}

const language = 'en-us'

function get(string)
{
    return LANGUAGES[language][string]
}

module.exports = {
    get
}
