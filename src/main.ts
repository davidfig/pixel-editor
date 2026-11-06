import { App } from './app'
import { Layout } from './ui/layout'

const app = await App.create()
const layout = new Layout(app)

// handy for debugging in the console
Object.assign(window, { app, layout })
