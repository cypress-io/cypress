const $errUtils = require('../../../cypress/error_utils')

module.exports = (Commands, Cypress, cy, state, config) => {
  return Commands.addAll({ prevSubject: 'element' }, {
    hover (args) {
      return $errUtils.throwErrByPath('hover.not_implemented')
    },
  })
}
