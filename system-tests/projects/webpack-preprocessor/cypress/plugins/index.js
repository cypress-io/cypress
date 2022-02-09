const proxyquire = require('proxyquire')

// force typescript to always be non-requireable
const wp = proxyquire('@cypress/webpack-preprocessor', {
  typescript: null,
})

module.exports = (on) => {
  on('file:preprocessor', wp())
}
