const path = require('path')

module.exports = {
  spec: 'test/unit/**/*.spec.{js,ts,tsx,jsx}',
  require: path.resolve(__dirname, 'spec_helper.js'),
}
