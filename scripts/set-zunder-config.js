module.exports = function setZunderConfig (zunder) {
  zunder.setConfig({
    resolutions: ['react', 'react-dom', 'mobx', 'mobx-react'],
    staticGlobs: {
      'static/**': '',
      'bower_components/font-awesome/fonts/**': '/fonts',
      'node_modules/@cypress/core-reporter/dist/reporter.css': '',
    },
  })
}
