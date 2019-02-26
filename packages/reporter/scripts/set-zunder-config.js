module.exports = function setZunderConfig (zunder) {
  zunder.setConfig({
    cacheBust: false,
    prodDir: 'dist',
    scripts: {
      'src/main.jsx': 'reporter.js',
    },
    staticGlobs: {
      'node_modules/font-awesome/fonts/**': '/fonts',
    },
    stylesheets: {
      'src/main.scss': {
        watch: ['src/**/*.scss'],
        output: 'reporter.css',
      },
    },
  })
}
