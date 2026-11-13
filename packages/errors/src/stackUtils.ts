import _ from 'lodash'
import type { ErrorLike } from './errorTypes'

export const stackLineRegex = /(?::\d+:\d+|<unknown>|\[native code\])\)?$/

type MessageLines = [string[], string[]] & { messageEnded?: boolean }

// returns tuple of [message, stack]
export const splitStack = (stack: string) => {
  const lines = stack?.split('\n')

  return _.reduce(lines, (memo, line) => {
    if (memo.messageEnded || stackLineRegex.test(line)) {
      memo.messageEnded = true
      memo[1].push(line)
    } else {
      memo[0].push(line)
    }

    return memo
  }, [[], []] as MessageLines)
}

export const unsplitStack = (messageLines: string | string[], stackLines: string[]) => {
  return _.castArray(messageLines).concat(stackLines).join('\n')
}

export const getStackLines = (stack: string) => {
  const [, stackLines] = splitStack(stack)

  return stackLines
}

// Keep the path out of the regex: matching it alongside the frame prefix
// backtracks catastrophically on long lines
const stackLineLocationRegex = /:(\d+):(\d+)\)?$/
const lineTerminatorRegex = /[\n\r\u2028\u2029]/

/**
 * Captures & returns the absolute path, line, and column from a stack trace line.
 * The path is whatever sits between the last `(` and the trailing `:line:column`.
 */
export const parseStackLine = (line: string): null | { absolute: string, line: number, column: number } => {
  const frame = line.trimStart()

  if (lineTerminatorRegex.test(frame)) {
    return null
  }

  const location = stackLineLocationRegex.exec(frame)

  if (!location) {
    return null
  }

  const openParenIndex = frame.lastIndexOf('(', location.index)
  const absolute = openParenIndex === -1 ? '' : frame.slice(openParenIndex + 1, location.index)

  if (!absolute) {
    return null
  }

  return { absolute, line: Number(location[1]), column: Number(location[2]) }
}

/**
 * Takes the stack and returns only the lines that contain stack-frame like entries,
 * matching the `stackLineRegex` above
 */
export const stackWithoutMessage = (stack: string) => {
  return getStackLines(stack).join('\n')
}

export const replacedStack = (err: ErrorLike, newStack: string) => {
  // if err already lacks a stack or we've removed the stack
  // for some reason, keep it stackless
  if (!err.stack) return err.stack

  const errString = err.toString()
  const stackLines = getStackLines(newStack)

  return unsplitStack(errString, stackLines)
}
