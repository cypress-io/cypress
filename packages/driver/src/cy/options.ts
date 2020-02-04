import _ from 'lodash'

export const getIndexOfUserOptions = (name: string, args: any[]): number => {
  const lastIndex = args.length - 1
  const lastArg = args[lastIndex]

  // Handle exceptions
  if (name === 'invoke') {
    return args.length >= 2 && !_.isFunction(args[0]) ? 0 : -1
  }

  if (name === 'spread' || name === 'then') {
    return args.length === 2 ? 0 : -1
  }

  if (name === 'request') {
    return args.length === 1 && _.isObject(args[0]) ? 0 : -1
  }

  if (name === 'wait') {
    return args.length === 2 ? 1 : -1
  }

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
