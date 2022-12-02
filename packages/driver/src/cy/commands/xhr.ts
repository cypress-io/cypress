import $errUtils from '../../cypress/error_utils'

export default (Commands) => {
  return Commands.addAll({
    server () {
      return $errUtils.throwErrByPath('server.removed', { args: { cmd: 'server' } })
    },

    route (...args) {
      return $errUtils.throwErrByPath('route.removed', { args: { cmd: 'route' } })
    },
  })
}
