import enUs from '../data/text/en-us.json'

const LANGUAGES = {
    'en-us': enUs
}

const language = 'en-us'

export function get(string)
{
    return LANGUAGES[language][string]
}