module.exports = function setZunderConfig (zunder) {
  var commonScripts = ['@cypress/react-tooltip', 'react', 'react-dom', 'mobx', 'mobx-react', 'lodash']

  zunder.setConfig({
    cacheBust: false,
    externalBundles: [
      {
        scriptName: 'common.js',
        libs: commonScripts.map((file) => ({ file })),
      }
    ],
    prodDir: 'dist',
    resolutions: commonScripts,
    scriptName: 'runner.js',
    stylesheetName: 'runner.css',
    staticGlobs: {
      'static/**': '',
      'node_modules/font-awesome/fonts/**': '/fonts'
    },
  })
}
