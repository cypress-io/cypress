const $errUtils = require('../../../cypress/error_utils')

module.exports = (Commands) => {
  return Commands.addAll({ prevSubject: 'element' }, {
    hover () {
      return $errUtils.throwErrByPath('hover.not_implemented')
    },
  })
}
