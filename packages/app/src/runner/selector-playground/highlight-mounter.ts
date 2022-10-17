import { App, createApp } from 'vue'
import HighlightApp from './HighlightApp.ce.vue'

let app: App<Element> | null = null

export default {
  mount (container: Element, selector: string, styles: any[]) {
    if (app) {
      app.unmount()
    }

    app = createApp(HighlightApp, {
      selector,
      styles,
    })

    app.mount(container)
  },
}
