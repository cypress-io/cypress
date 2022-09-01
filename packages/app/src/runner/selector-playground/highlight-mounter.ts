import { App, createApp } from 'vue'
import HighlightApp from './HighlightApp.vue'

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

  css: `
.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.tooltip {
  top: -10000px;
  left: -10000px;

  position: absolute;
  background: #333;
  border: solid 1px #333;
  border-radius: 3px;
  color: #e3e3e3;
  font-size: 12px;
  padding: 4px 6px;
  text-align: center;
}

.arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent #333 transparent;
}`,
}
