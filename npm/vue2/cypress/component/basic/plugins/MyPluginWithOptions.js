// https://vuejs.org/v2/guide/plugins.html
// https://alligator.io/vuejs/creating-custom-plugins/
export const MyPluginWithOptions = {
  install (Vue, options) {
    if (!options) {
      throw new Error('MyPlugin is missing options!')
    }

    // this method uses options argument
    Vue.anotherPluginMethod = function () {
      return options.label
    }
  },
}
