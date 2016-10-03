var cyIcons = require('@cypress/core-icons')

module.exports = function (zunder) {
  var staticGlobs = {
    'node_modules/fira/woff/**/*': '/woff',
    'node_modules/font-awesome/fonts/*.+(eot|svg|ttf|woff|woff2|otf)': '/fonts',
  }
  staticGlobs[cyIcons.getPathToLogo('cypress-inverse.png')] = '/img'

  zunder.setConfig({
    cacheBust: false,
    prodDir: 'dist',
    staticGlobs: staticGlobs
  })
}
