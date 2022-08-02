import $errUtils from '../../../cypress/error_utils'

export default (Commands) => {
  return Commands.addAll({ prevSubject: 'element' }, {
    hover () {
      return $errUtils.throwErrByPath('hover.not_implemented')
    },
  })
}
