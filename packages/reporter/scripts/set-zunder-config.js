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
