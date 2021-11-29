import $errUtils from '../../../cypress/error_utils'

export default (Commands) => {
  return Commands.addAll({ prevSubject: 'element' }, {
    mount () {
      return $errUtils.throwErrByPath('mount.not_implemented')
    },
  })
}
