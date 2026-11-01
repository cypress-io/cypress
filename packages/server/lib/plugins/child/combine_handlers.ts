import _ from 'lodash'
import { mergeLaunchOptions, mergeScreenshotDetails } from '../merge_plugin_results'
import type { PluginEventHandler, RegisteredPluginHandler, TaskEventHandler } from './types'

type CombineHandlers = (first: RegisteredPluginHandler, second: RegisteredPluginHandler) => RegisteredPluginHandler

// Applies a handler's result to the value it was given, or returns undefined
// when the server would ignore that result
type MergeResult = (value: any, result: any) => Record<string, any> | undefined

function assertFunctionHandler (handler: RegisteredPluginHandler): asserts handler is PluginEventHandler {
  if (!_.isFunction(handler)) {
    throw new Error('Unexpected: validateEvent should only allow function handlers for this event')
  }
}

function assertTaskHandler (handler: RegisteredPluginHandler): asserts handler is TaskEventHandler {
  if (_.isFunction(handler)) {
    throw new Error('Unexpected: validateEvent should only allow an object handler for task')
  }
}

const mergeTasks: CombineHandlers = (first, second) => {
  assertTaskHandler(first)
  assertTaskHandler(second)

  const duplicates = _.intersection(_.keys(first), _.keys(second))

  if (duplicates.length) {
    require('@packages/errors').warning('DUPLICATE_TASK_KEY', duplicates)
  }

  return _.extend(first, second)
}

// For events whose handlers' return values the server ignores
const runInSequence: CombineHandlers = (first, second) => {
  assertFunctionHandler(first)
  assertFunctionHandler(second)

  return async (...args) => {
    await first(...args)
    await second(...args)
  }
}

// Each handler gets its own copy, so like a single handler, only what it
// returns is applied. When no handler returns anything the server uses, the
// combined handler returns undefined so the server keeps its own value.
const chainResults = (valueIndex: number, merge: MergeResult): CombineHandlers => {
  return (first, second) => {
    assertFunctionHandler(first)
    assertFunctionHandler(second)

    const invoke = (handler: PluginEventHandler, args: any[], value: any) => {
      return handler(...Object.assign([...args], { [valueIndex]: _.cloneDeep(value) }))
    }

    return async (...args) => {
      const value = args[valueIndex]
      const firstValue = merge(value, await invoke(first, args, value))
      const secondValue = merge(firstValue ?? value, await invoke(second, args, firstValue ?? value))

      return secondValue ?? firstValue
    }
  }
}

const mergeLaunchOptionsResult: MergeResult = (launchOptions, result) => {
  return result ? mergeLaunchOptions(launchOptions, result) : undefined
}

// Events not listed here keep only their last registered handler, since each
// should have exactly one (such as file:preprocessor)
export const combineHandlersByEvent: Record<string, CombineHandlers> = {
  'task': mergeTasks,
  'before:run': runInSequence,
  'after:run': runInSequence,
  'before:spec': runInSequence,
  'after:spec': runInSequence,
  'after:browser:launch': runInSequence,
  'before:browser:launch': chainResults(1, mergeLaunchOptionsResult),
  'after:screenshot': chainResults(0, mergeScreenshotDetails),
}
