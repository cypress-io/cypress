const _ = require('lodash')
const baseConfig = require('./.eslintrc.json')

module.exports = _.defaultsDeep({}, baseConfig, {
  rules: {
    // auto-fix removing some common unnecessary returns
    '@cypress/dev/no-return-before': 'error',
    // make sure we use arrow callback
    'prefer-arrow-callback': 'error',
    // since our jscodemod scripts will format one-line-body functions as single line
    'arrow-body-style': ['error', 'always'],
  },
})
