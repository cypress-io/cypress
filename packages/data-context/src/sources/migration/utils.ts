import _ from 'lodash'

export const isDefaultSupportFile = (supportFile: string) => {
  if (_.isNil(supportFile) || !_.isBoolean(supportFile) && supportFile.match(/(^|\.+\/)cypress\/support($|\/index($|\.(ts|js|coffee)$))/)) {
    return true
  }

  return false
}
