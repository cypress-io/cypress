const webpackPreprocessor = require('../../../..')

module.exports = (on) => {
  const webpack = require('../../webpack.config.js')

  on('file:preprocessor', webpackPreprocessor({ webpack }))
}
