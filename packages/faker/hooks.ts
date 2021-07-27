import * as commandStubs from './commands'
// Hooks are highly dependent on the structure of the Runnable they're inside of

let idCounter = 0

/**
 * @param {Runnable} options
 * The options object passed into the command
 * Responsible for creating the correct hookIds and idCounters
 */
export const makeHook = (options = {}) => {
  return (overrides = {}) => {
    idCounter++
    const testId = `r${idCounter}`
    const hookId = options.hookName === 'test body' ? testId : `h${idCounter}`

    return {
      testId,
      hookId,
      hookName: 'test body',
      ...options,
      ...overrides,
    }
  }
}

export const reset = () => idCounter = 0

export const beforeEachHook = makeHook({ hookId: 'h2', hookName: 'before each' })

export const beforeAllHook = makeHook({ hookId: 'h3', hookName: 'before all' })

export const afterEachHook = makeHook({ hookId: 'h4', hookName: 'after each' })

export const afterAllHook = makeHook({ hookId: 'h5', hookName: 'after all' })

export const testBodyHook = makeHook({ hookId: 'r3', hookName: 'test body' })

const rootHook = beforeEachHook({ hookId: 'h1' })
const h1 = beforeEachHook()
const h2 = afterEachHook()
const h3 = beforeAllHook()
const h4 = beforeAllHook()
const h5 = beforeEachHook()

export const runnableWithHooks = {
  root: true,
  tests: [],
  title: '',
  type: 'suite',
  hooks: [rootHook],
  suites: [
    {
      id: 'r2',
      title: 'suite 1',
      type: 'suite',
      root: false,
      hooks: [h1, h2],
      tests: [{
        id: 'r3',
        type: 'test',
        title: 'test 1',
        state: 'passed',
        commands: [
          {
            ...commandStubs.passedVisitCommand,
            hookId: 'h1',
            testId: 'r3',
          },
          {
            ...commandStubs.passedGetCommand,
            hookId: 'h1',
            testId: 'r3',
          },
          {
            ...commandStubs.passedGetCommand,
            hookId: 'r3',
            testId: 'r3',
            message: '.body',
          },
          {
            ...commandStubs.passedGetCommand,
            hookId: 'h2',
            testId: 'r3',
            message: '.cleanup',
          },
        ],
      }, {
        id: 'r6',
        type: 'test',
        title: 'test 2',
        state: 'failed',
        commands: [
          {
            ...commandStubs.passedVisitCommand,
            hookId: 'h1',
            testId: 'r6',
          },
          {
            ...commandStubs.failedGetCommand,
            hookId: 'h1',
            testId: 'r6',
          },
        ],
      }],
      suites: [{
        id: 'r4',
        type: 'suite',
        title: 'nested suite 1',
        root: false,
        hooks: [
          h3, h4, h5,
        ],
        tests: [{
          id: 'r5',
          type: 'test',
          title: 'test 3',
          state: 'passed',
          commands: [
            {
              ...commandStubs.passedLogCommand,
              hookId: 'h3',
              testId: 'r5',
              message: 'before1',
            },
            {
              ...commandStubs.passedLogCommand,
              hookId: 'h4',
              testId: 'r5',
              message: 'before2',
            },
            {
              ...commandStubs.passedVisitCommand,
              hookId: 'h1',
              testId: 'r5',
            },
            {
              ...commandStubs.passedGetCommand,
              hookId: 'h1',
              testId: 'r5',
              message: '.wrapper',
            },
            {
              ...commandStubs.passedGetCommand,
              hookId: 'h5',
              testId: 'r5',
              message: '.header',
            },
            {
              ...commandStubs.passedGetCommand,
              hookId: 'r5',
              testId: 'r5',
              message: '.body',
            },
            {
              ...commandStubs.passedGetCommand,
              hookId: 'h2',
              testId: 'r5',
              message: '.cleanup',
            },
          ],
        }],
      }],
    },
  ],
}
