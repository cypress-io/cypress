const path = require('path')

module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    const { extensions } = options

    if (browser.name === 'electron') {
      // electron doesn't support background pages yet, so load a devtools extension
      // instead which will work
      extensions.push(path.join(__dirname, '../../devtools-ext'))
    } else {
      extensions.push(path.join(__dirname, '../../../plugin-extension/ext'))
    }

    options.preferences.devTools = true

    return options
  })
}
