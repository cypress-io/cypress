module.exports = function setZunderConfig (zunder) {
  zunder.setConfig({
    cacheBust: false,
    coffeeCompiler: require('@packages/coffee'),
    prodDir: 'dist',
    resolutions: ['react', 'react-dom', 'mobx', 'mobx-react', 'lodash'],
    scriptName: 'cypress_runner.js',
    stylesheetGlobs: ['src/**/*.scss', '../reporter/src/**/*.scss'],
    stylesheetName: 'cypress_runner.css',
    staticGlobs: {
      'static/**': '',
      'node_modules/font-awesome/fonts/**': '/fonts',
    },
  })
}
