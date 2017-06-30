module.exports = function setZunderConfig (zunder) {
  const commonScripts = ['@cypress/react-tooltip', 'react', 'react-dom', 'mobx', 'mobx-react', 'lodash']

  zunder.setConfig({
    cacheBust: false,
    externalBundles: [
      {
        scriptName: 'common.js',
        libs: commonScripts.map((file) => ({ file })),
      },
    ],
    prodDir: 'dist',
    resolutions: commonScripts,
    scriptName: 'reporter.js',
    stylesheetName: 'reporter.css',
    staticGlobs: {
      'node_modules/font-awesome/fonts/**': '/fonts',
    },
  })
}
