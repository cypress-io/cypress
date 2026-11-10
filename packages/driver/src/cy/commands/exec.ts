import $errUtils from '../../cypress/error_utils'

export default (Commands) => {
  return Commands.addAll({
    exec () {
      return $errUtils.throwErrByPath('exec.removed')
    },
  })
}
