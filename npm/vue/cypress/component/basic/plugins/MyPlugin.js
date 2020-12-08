export const MyPlugin = {
  install (app) {
    app.provide('myPlugin', 'This is a plugin')
  },
}
