const path = require('path')

module.exports = {
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    indexHtmlFile: path.join(__dirname, 'index.html'),
    supportFile: path.join(__dirname, 'support.js'),
  },
}
