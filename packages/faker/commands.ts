import faker from 'faker'
import _ from 'lodash'

/**
 * Commands used as test data
 */

faker.seed(1) // set seed for deterministic tests

let commandId = 0 // Commands need to be sequential numbers

const message = () => _.kebabCase(`${faker.hacker.noun()} ${faker.hacker.adjective()}`)

export const reset = () => commandId = 0

// Base command is a get command that passes with a message
export const makeCommand = (options = {}) => {
  // console.log(message)

  return {
    ...{
      testId: 'r3',
      hookId: 'r3',
      name: 'get',
      timeout: 4000,
      state: 'passed',
      message: `.${message()}`,
      instrument: 'command',
      type: 'parent',
      id: commandId++,
    },
    ...options,
  }
}

export const baseCommand = makeCommand()

// Get and find commands
export const passedGetCommand = makeCommand({
  state: 'passed',
  message: `.${message()}`,
  type: 'parent',
  name: 'get',
})

export const failedGetCommand = makeCommand({
  state: 'failed',
  message: '#doesnt-exist',
  type: 'parent',
  name: 'find',
})

export const passedVisitCommand = makeCommand({
  message: 'http://localhost:3000',
  name: 'visit',
  state: 'passed',
  type: 'parent',
})

export const longCommand = makeCommand({
  message: 'http://localhost:3000woiefwoefjivw woifjweofj weieieiieieieieie',
  name: 'visit woeifjewoifj ewfoijewiofjwiofljweifj',
})

export const passedSingleVisibleElement = makeCommand({
  ...passedGetCommand,
  message: `.${message()}`,
  numElements: 1,
})

export const failedElementDoesNotExist = makeCommand({
  ...failedGetCommand,
  message: `#not-visible`,
  visible: false,
  numElements: 0,
})

export const passedXhrStub = makeCommand({
  name: 'xhr',
  displayName: 'xhr stub',
  event: true,
  type: 'parent',
  message: null,
  renderProps: {
    message: 'GET --- /posts',
    indicator: 'successful',
  },
})

export const passsedFoundMultipleElements = makeCommand({
  ...passedGetCommand,
  message: `.${message()}`,
  numElements: 4,
})

export const xhrStubRichTextLongMessage = makeCommand({
  ...passedXhrStub,
  renderProps: {
    message: 'Lorem ipsum **dolor** _sit_ amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
    indicator: 'successful',
  },
})

export const passedNotVisibleMultipleElements = makeCommand({
  ...passedGetCommand,
  message: `.${message()}`,
  visible: false,
  numElements: 4,
})

export const makeXhr = (x, dupe = false, options = {}) => {
  const message = dupe ? `duplicate` : `unique-${id()}`

  return {
    ...passedXhrStub,
    id: x,
    message: `GET --- /${message}`,
    state: 'passed',
    alias: message + x,
    ...options,
  }
}

export const makeNDupeXhrStubsWithOptions = (x = 5, options = {}) => _.times(x, (x) => makeXhr(x, true, options))

export const xhrDupeStubsNoAlias = makeNDupeXhrStubsWithOptions(5, { alias: false })

export const xhrDupeStubsWithAlias = makeNDupeXhrStubsWithOptions(5)

export const passedLogCommand = makeCommand({
  name: 'log',
  passed: true,
  message: `${faker.hacker.phrase()}`,
})
