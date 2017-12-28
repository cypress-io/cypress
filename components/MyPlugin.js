// https://vuejs.org/v2/guide/plugins.html
export const MyPlugin = {
  install (Vue, options) {
    // 1. add global method or property
    Vue.aPluginMethod = function () {
      return 'foo'
    }
  }
}
