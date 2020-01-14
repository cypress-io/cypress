import _ from 'lodash'
import $dom from '../dom'

const LOGGED_ARRAY_SIZE = 10
const LOGGED_OBJ_SIZE = 10
const LONG_STRING_LENGTH = 100
const MESSAGE_STRING_MAX = 30

interface Values {
  subject: any
  expected: any
  actual: any
}

interface Args {
  0: boolean
  1?: string
  2?: string
}

export const replaceToBigValueTags = (args: Args, { subject, expected, actual }: Values) => {
  if (typeof args[1] !== 'string' || typeof args[2] !== 'string') {
    return args
  }

  if (isBigValue(subject)) {
    args = replaceArgs(args, /#{this}/g, '%{this}')
  }

  if (isBigValue(expected)) {
    args = replaceArgs(args, /#{exp}/g, '%{exp}')
  }

  if (isBigValue(actual)) {
    args = replaceArgs(args, /#{act}/g, '%{act}')
  }

  return args
}

export const logBigValue = (value: any) => {
  return isBigValue(value)
    ? {
      summary: summarizeValue(value),
      value,
    }
    : value
}

const isBigValue = (value: any) => {
  return value && isLongString(value as string) ||
  isBigArray(value as any[]) ||
  isBigObject(value as object)
}

const isLongString = (value: string) => {
  return typeof (value) === 'string' && value.length > LONG_STRING_LENGTH
}

const isBigArray = (value: any[]) => {
  return (Array.isArray(value) && value.length > LOGGED_ARRAY_SIZE)
}

const isBigObject = (value: object) => {
  return (_.isObject(value) &&
  !($dom.isJquery(value) || $dom.isElement(value)) &&
  Object.keys(value).length > LOGGED_OBJ_SIZE)
}

const replaceArgs = (args: Args, target: RegExp, tag: string) => {
  args[1] = args[1]!.replace(target, tag)
  args[2] = args[2]!.replace(target, tag)

  return args
}

const summarizeValue = (value: any) => {
  if (isLongString(value)) {
    return `${partialString(value, LONG_STRING_LENGTH)} [...more]`
  }

  if (isBigArray(value)) {
    const first10 = partialArray(value, LOGGED_ARRAY_SIZE)

    let first10str = ''

    first10.forEach((item) => {
      const val = stringifyValue(item)

      first10str += `${val}, `
    })

    return `[${first10str}...more]`
  }

  if (isBigObject(value)) {
    const summaryObj = partialObject(value, LOGGED_OBJ_SIZE)
    let summaryStr = ''

    Object.keys(summaryObj).forEach((key) => {
      const val = stringifyValue(value[key])

      summaryStr += `${key}: ${val}, `
    })

    return `{${summaryStr}...more}`
  }

  throw new Error(`${value} is not big.`)
}

const stringifyValue = (value: any) => {
  if (Array.isArray(value)) {
    return `Array(${value.length})`
  }

  if (typeof (value) === 'object') {
    return '{object}'
  }

  if (typeof (value) === 'string') {
    return value.length > MESSAGE_STRING_MAX
      ? `"${value.substring(0, MESSAGE_STRING_MAX)} [...more]"`
      : `"${value}"`
  }

  return value
}

const partialString = (value: string, size: number) => {
  return (value).substring(0, size)
}

const partialArray = (value: any[], size: number) => {
  return value.slice(0, size)
}

const partialObject = (value: object, size: number) => {
  const keys = Object.keys(value)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const first10Keys = keys.sort(collator.compare).slice(0, LOGGED_OBJ_SIZE)
  const obj = {}

  first10Keys.forEach((key) => {
    obj[key] = value[key]
  })

  return obj
}
