import _ from 'lodash'
import { mergeLaunchOptions } from './browser_launch'
import type { PluginEventHandler } from './types'

type CombineHandlers = (first: PluginEventHandler, second: PluginEventHandler) => PluginEventHandler

// Applies a handler's result to the value it was given, or returns undefined
// when the server would ignore that result
type MergeResult = (value: any, result: any) => Record<string, any> | undefined

// For events whose handlers' return values the server ignores
const runInSequence: CombineHandlers = (first, second) => {
  return async (...args) => {
    await first(...args)
    await second(...args)
  }
}

// Passes each handler the value as updated by the handlers before it. When no
// handler returns anything the server uses, the combined handler returns
// undefined so the server keeps its own value.
const chainResults = (valueIndex: number, merge: MergeResult): CombineHandlers => {
  return (first, second) => {
    return async (...args) => {
      const firstValue = merge(args[valueIndex], await first(...args))
      const secondArgs = firstValue ? Object.assign([...args], { [valueIndex]: firstValue }) : args
      const secondValue = merge(secondArgs[valueIndex], await second(...secondArgs))

      return secondValue ?? firstValue
    }
  }
}

const mergeScreenshotDetails: MergeResult = (details, result) => {
  return _.isPlainObject(result) ? { ...details, ..._.pick(result, 'size', 'dimensions', 'path') } : undefined
}

// Repeat registrations of these events are combined into one handler instead
// of the last registration replacing the rest
export const combineHandlersByEvent: Record<string, CombineHandlers> = {
  'before:run': runInSequence,
  'after:run': runInSequence,
  'before:spec': runInSequence,
  'after:spec': runInSequence,
  'before:browser:launch': chainResults(1, mergeLaunchOptions),
  'after:screenshot': chainResults(0, mergeScreenshotDetails),
}
