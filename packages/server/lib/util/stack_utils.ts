import _ from 'lodash'

const stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/

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
  }, [[], []] as any[] & {messageEnded: boolean})
}

export const unsplitStack = (messageLines, stackLines) => {
  return _.castArray(messageLines).concat(stackLines).join('\n')
}

export const getStackLines = (stack) => {
  const [, stackLines] = splitStack(stack)

  return stackLines
}

export const stackWithoutMessage = (stack) => {
  return getStackLines(stack).join('\n')
}

export const replacedStack = (err, newStack) => {
  // if err already lacks a stack or we've removed the stack
  // for some reason, keep it stackless
  if (!err.stack) return err.stack

  const errString = err.toString()
  const stackLines = getStackLines(newStack)

  return unsplitStack(errString, stackLines)
}
