import type { App } from 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    anotherPluginMethod: () => string
  }
}

// https://vuejs.org/v2/guide/plugins.html
// https://alligator.io/vuejs/creating-custom-plugins/
export const MyPluginWithOptions = {
  install (app: App, options?: { label: string }) {
    if (!options) {
      throw new Error('MyPlugin is missing options!')
    }

    // this method uses options argument
    app.config.globalProperties.anotherPluginMethod = function () {
      return options.label
    }
  },
}
