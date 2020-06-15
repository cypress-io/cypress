import _ from 'lodash'

export const getIndexOfUserOptions = (name: string, args: any[]): number => {
  const lastIndex = args.length - 1
  const lastArg = args[lastIndex]

  // Handle exceptions

  // Handle most common case

  if (_.isObject(lastArg) && !_.isArray(lastArg) && !_.isRegExp(lastArg)) {
    return lastIndex
  }

  return -1
}

export const getUserOptions = (name: string, args: any[]) => {
  const index = getIndexOfUserOptions(name, args)

  return index !== -1 ? args[index] : null
}
