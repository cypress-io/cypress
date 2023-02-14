import _ from 'lodash'
import type { ErrorLike } from './errorTypes'

export const stackLineRegex = /^\s*(at )?.*@?(?:\(?.*(?::\d+:\d+|<unknown>|\[native code\])+\)?)$/

type MessageLines = [string[], string[]] & {messageEnded?: boolean}

// returns tuple of [message, stack]
export const splitStack = (stack: string) => {
  const lines = stack.split('\n')

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

/**
 * Captures & returns the absolute path, line, and column from a stack trace line
 */
export const parseStackLine = (line: string): null | { absolute: string, line: number, column: number } => {
  const stackLineCapture = /^\s*(?:at )?.*@?\((.*?)\:(\d+)\:(\d+)\)?$/
  const result = stackLineCapture.exec(line)

  if (!result?.[1]) {
    return null
  }

  return { absolute: result[1], line: Number(result[2]), column: Number(result[3]) }
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
