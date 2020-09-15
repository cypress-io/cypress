const path = require('path')

module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    options.extensions.push(path.join(__dirname, '../../../plugin-extension/ext'))
    options.preferences.devTools = true

    return options
  })
}
