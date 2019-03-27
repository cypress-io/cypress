module.exports = function setZunderConfig (zunder) {
  const { browserifyOptions } = zunder.config

  browserifyOptions.transform[0][1].plugins.push(['prismjs', {
    'languages': ['javascript'],
    'plugins': ['line-numbers', 'line-highlight'],
    'theme': 'default',
    'css': false,
  }])

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
