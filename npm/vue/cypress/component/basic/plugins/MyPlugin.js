// https://vuejs.org/v2/guide/plugins.html
// https://alligator.io/vuejs/creating-custom-plugins/
export const MyPlugin = {
  install (app) {
    // 1. add global method or property
    app.config.globalProperties.aPluginMethod = function () {
      return 'foo'
    }
  },
}
