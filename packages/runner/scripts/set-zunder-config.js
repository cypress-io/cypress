module.exports = function setZunderConfig (zunder) {
  const { browserifyOptions } = zunder.config
  // coffeescript support
  browserifyOptions.extensions.push('.coffee')
  browserifyOptions.transform.push([
    zunder.defaults.browserify.transformCoffeeify.module,
    {
      coffeeCompiler: require('@packages/coffee'),
    },
  ])

  zunder.setConfig({
    cacheBust: false,
    browserifyOptions,
    coffeeCompiler: require('@packages/coffee'),
    prodDir: 'dist',
    scripts: {
      'src/main.jsx': 'cypress_runner.js',
    },
    staticGlobs: {
      'static/**': '',
      'node_modules/font-awesome/fonts/**': '/fonts',
    },
    stylesheets: {
      'src/main.scss': {
        watch: ['src/**/*.scss', '../reporter/src/**/*.scss'],
        output: 'cypress_runner.css',
      },
      'src/selector-playground/selector-playground.scss': {
        watch: ['src/selector-playground/*.scss'],
        output: 'cypress_selector_playground.css',
      },
    },
  })
}
