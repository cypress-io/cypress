const path = require('path')

module.exports = {
  spec: 'src/**/*.spec.{js,ts,tsx,jsx}',
  require: path.resolve(__dirname, 'spec_helper.js'),
}
