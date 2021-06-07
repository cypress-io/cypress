// https://vuejs.org/v2/guide/plugins.html
// https://alligator.io/vuejs/creating-custom-plugins/
export const MyPlugin = {
  install (Vue) {
    // 1. add global method or property
    Vue.aPluginMethod = function () {
      return 'foo'
    }
  },
}
