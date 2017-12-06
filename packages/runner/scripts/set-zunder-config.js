module.exports = function setZunderConfig (zunder) {
  zunder.setConfig({
    cacheBust: false,
    coffeeCompiler: require('@packages/coffee'),
    prodDir: 'dist',
    resolutions: ['react', 'react-dom', 'mobx', 'mobx-react', 'lodash'],
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
      'src/selector-helper/selector-helper.scss': {
        watch: ['src/selector-helper/*.scss'],
        output: 'cypress_selector_helper.css',
      },
    },
  })
}
