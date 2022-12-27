const path = require('path')

module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    indexHtmlFile: path.join(__dirname, 'index.html'),
    supportFile: path.join(__dirname, 'support.js'),
  },
}
