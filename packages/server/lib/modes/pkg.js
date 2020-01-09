const Promise = require('bluebird')
const pkg = require('@packages/root')

module.exports = () => {
  return Promise.resolve(pkg)
}
