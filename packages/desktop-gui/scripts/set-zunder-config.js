const zunder = require('zunder')
const cyIcons = require('@cypress/icons')

module.exports = () => {
  const staticGlobs = {
    'node_modules/fira/woff/**/*': '/woff',
    'node_modules/font-awesome/fonts/*.+(eot|svg|ttf|woff|woff2|otf)': '/fonts',
  }

  staticGlobs[cyIcons.getPathToLogo('cypress-inverse.png')] = '/img'

  zunder.setConfig({
    cacheBust: false,
    prodDir: 'dist',
    staticGlobs,
  })
}
