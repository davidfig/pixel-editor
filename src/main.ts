import { App } from './app'
import { Layout } from './ui/layout'

const app = await App.create()
const layout = new Layout(app)

// handy for debugging in the console
Object.assign(window, { app, layout })

// lets the browser install the editor as an app that works offline (production builds only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('service worker not registered:', e))
}
