// https://vuejs.org/v2/guide/plugins.html
// https://alligator.io/vuejs/creating-custom-plugins/
export const MyPluginWithOptions = {
  install (app, options) {
    if (!options) {
      throw new Error('MyPlugin is missing options!')
    }

    // this method uses options argument
    app.config.globalProperties.label = function () {
      return options.label
    }
  },
}
