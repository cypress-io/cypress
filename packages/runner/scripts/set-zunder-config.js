module.exports = function setZunderConfig (zunder) {
  const { browserifyOptions } = zunder.config

  // browserifyOptions.debug = true

  // coffeescript support
  browserifyOptions.extensions.push('.coffee')
  browserifyOptions.transform.push([
    zunder.defaults.browserify.transformCoffeeify.module,
    {
      coffeeCompiler: require('@packages/coffee'),
    },
  ])
  // ensure no duplicates of common dependencies between runner, reporter, & driver
  browserifyOptions.transform.push([
    zunder.defaults.browserify.transformAliasify.module,
    {
      aliases: {
        'bluebird': require.resolve('bluebird'),
        'lodash': require.resolve('lodash'),
        'mobx': require.resolve('mobx'),
        'mobx-react': require.resolve('mobx-react'),
        'react': require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      },
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
