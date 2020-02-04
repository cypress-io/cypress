const path = require('path')

module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    const { extensions } = options

    extensions.push(path.join(__dirname, '../../../plugin-extension/ext'))

    return options
  })
}
