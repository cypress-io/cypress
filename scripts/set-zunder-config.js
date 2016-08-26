module.exports = function setZunderConfig (zunder) {
  zunder.setConfig({
    resolutions: ['react', 'react-dom', 'mobx', 'mobx-react'],
    scriptName: 'runner.js',
    stylesheetName: 'runner.css',
    staticGlobs: {
      'static/**': '',
      'node_modules/font-awesome/fonts/**': '/fonts',
      'node_modules/@cypress/core-reporter/dist/reporter.css': '',
    },
  })
}
