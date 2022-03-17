import _ from 'lodash'
import { loadSpec, shouldHaveTestResults } from './support/spec-loader'
import EventEmitter from 'events'
import { MochaHookSanitized, MochaInternalSanitized, MochaInternalUnsanitized, MochaLifecycleData, MochaRunnerFailSanitizied, MochaSuiteSantizied, MochaTestFailSanitized, MochaTestPassSanitized, SanitizedFail, SanitizedInvocationDetails, SanitizedMochaLifecycleData, snapshotKeys } from './support/mochaTypes'

const hooks = ['before all', 'before each', 'after all', 'after each'] as const

const stringifyShort = (obj) => {
  const constructorName = _.get(obj, 'constructor.name')

  if (constructorName && !_.includes(['Object', 'Array'], constructorName)) {
    return `{${constructorName}}`
  }

  if (_.isArray(obj)) {
    return `[Array ${obj.length}]`
  }

  if (_.isObject(obj)) {
    return `{Object ${Object.keys(obj).length}}`
  }

  return obj
}

const eventCleanseMap = {
  snapshots: stringifyShort,
  parent: stringifyShort,
  tests: stringifyShort,
  commands: stringifyShort,
  invocationDetails: stringifyShort,
  body: () => '[body]',
  wallClockStartedAt: () => 'match.date',
  lifecycle: () => 'match.number',
  fnDuration: () => 'match.number',
  duration: () => 'match.number',
  afterFnDuration: () => 'match.number',
  wallClockDuration: () => 'match.number',
  stack: () => 'match.string',
  message: () => '[error message]',
  sourceMappedStack: () => 'match.string',
  parsedStack: () => 'match.array',
  err: () => ({
    message: "[error message]",
    name: "AssertionError",
    stack: "match.string",
    sourceMappedStack: "match.string",
    parsedStack: "match.array"
  }),
  startTime: new Date(0),
  start: () => 'match.date',
  end: () => 'match.date',
  timings: (arg: MochaLifecycleData): SanitizedMochaLifecycleData => {
    let sanitizedLifecycleData: SanitizedMochaLifecycleData = {
      lifecycle: 'match.number',
    }

    for (const hook of hooks) {
      const hooksToSanitize = arg[hook]
      if (!hooksToSanitize) {
        continue
      }

      sanitizedLifecycleData[hook] = hooksToSanitize.map(oldHook => ({
        ...oldHook,
        fnDuration: "match.number",
        afterFnDuration: "match.number"
      }))
    }

    return sanitizedLifecycleData
  },
}

const runnerMochaEventsMap = new Map([
  ['runner:start', ['mocha', 'start']],
  ['runner:suite:start', ['mocha', 'suite']],
  ['runner:suite:start', ['mocha', 'suite']],
  ['runner:hook:start', ['mocha', 'hook']],
  ['runner:test:before:run', ['mocha', 'test:before:run']],
  ['runner:fail', ['mocha', 'fail']],
  ['runner:suite:end', ['mocha', 'suite end' ]],
  ['runner:test:end', ['mocha', 'test end']],
  ['runner:test:after:run', ['mocha', 'test:after:end']],
  ['runner:suite:end', ['mocha', 'suite end']],
  ['runner:end', ['mocha', 'end']],
])

const sanitizedError: SanitizedFail = {
  message: "[error message]",
  name: "AssertionError",
  stack: "match.string",
  sourceMappedStack: "match.string",
  parsedStack: "match.array"
}
const keysToEliminate = ['codeFrame'] as const

const removeUnusedKeysForTestSnapshot = <T>(obj: T): T => {
  for (const key of keysToEliminate) {
    delete obj[key]
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key in obj) {
      const transform = eventCleanseMap[key]?.(value)

      if (!transform) {
        continue
      }

      obj[key] = transform
    } else {
      delete obj[key]
    }
  }

  return obj
}

describe('src/cypress/runner', { retries: 0 }, () => {
  describe('tests finish with correct state', () => {
    describe('hook failures', () => {
      it('fail in [before]', (done) => {
        loadSpec({
          fileName: 'fail-with-before.mochaEvents.cy.js',
          passCount: 0,
          failCount: 1
        }).then((win) => {
          win.getEventManager().on('cypress:in:cypress:done' ,(args: Array<Array<string | Record<string, any>>>) => {
            // const sanitizeDetails = (invocationDetails: Record<string, any>): SanitizedInvocationDetails => `{Object ${Object.keys(invocationDetails).length}}`
            const data = args.map(mochaEvent => {
              return mochaEvent.map(payload => {
                if (typeof payload === 'string') {
                  return payload
                }
                return removeUnusedKeysForTestSnapshot(payload)
              })
            })

            console.log(JSON.stringify(data, null, 2))
            done()

            const sanitize = (event: string, internals: MochaInternalUnsanitized[]): Array<MochaInternalSanitized | undefined> => {
              return internals.map(_data => {
                const data = removeUnusedKeysForTestSnapshot(_data)
                return data

                // switch (data.type) {
                //   case "suite": 
                //     const suite: MochaSuiteSantizied = data.invocationDetails
                //       ? {...data, invocationDetails: sanitizeDetails(data.invocationDetails)}
                //       : {...data}
                //     return suite

                //   case 'test': 
                //     if (data.state === "passed") {
                //       const sanitizedPassed: MochaTestPassSanitized = {
                //         ...data,
                //         body: '[body]',
                //         invocationDetails: sanitizeDetails(data.invocationDetails),
                //         duration: 'match.number',
                //         wallClockStartedAt: 'match.number',
                //         _testConfig: {
                //           testConfigList: [],
                //           unverifiedTestConfig: {}
                //         }
                //       }

                //       return sanitizedPassed
                //     } else if (data.state === 'failed') {
                //       const sanitizedFail: MochaTestFailSanitized = {
                //           ...data,
                //         body: '[body]',
                //         invocationDetails: sanitizeDetails(data.invocationDetails),
                //         duration: 'match.number',
                //         wallClockStartedAt: 'match.number',
                //         err: sanitizedError,
                //         _testConfig: {
                //           testConfigList: [],
                //           unverifiedTestConfig: {}
                //         }
                //       }

                //       return sanitizedFail
                //     } else {
                //       return {
                //         ...data,
                //         invocationDetails: sanitizeDetails(data.invocationDetails),
                //       }
                //     }

                //   case 'hook': 
                //     const hook: MochaHookSanitized = {
                //       ...data, 
                //       body: '[body]', 
                //       invocationDetails: sanitizeDetails(data.invocationDetails)
                //     }
                //     return hook

                //   default:
                //     if (event === 'runner:start') {
                //       return {
                //         start: 'match.date'
                //       }
                //     }

                //     if (event === 'runner:end') {
                //       return {
                //         end: 'match.date'
                //       }
                //     }

                //     if (event === 'runner:fail') {
                //       return sanitizedError
                //     }

                //     if (data.type === undefined) {
                //       console.log('Type undefined!', event, data)
                //       return
                //     }

                //     throw Error(`Unknown data type received. Got ${data.type}. Payload: ${JSON.stringify(data)}`)
                // }
              })
            }

              // const normalizedEvent = runnerMochaEventsMap.get(event)
            // const sanitizedMochaEvents = 
            // args.reduce<Array<any>>((acc, curr) => {
            //   // const mochaEvent = runnerMochaEventsMap.get(curr.event)
            //   // console.log(`normalizing ${curr.event} -> ${mochaEvent}`)
            //   // if (!mochaEvent) {
            //     // return acc
            //   // }

            //   acc.push([
            //     ...curr.event, 
            //     ...sanitize(curr.event, curr.data)
            //   ])

            //   return acc
            // }, [])
              
            //   // arg => [arg.event, ...sanitize(arg.event, arg.data)])

            // console.log(JSON.stringify(sanitizedMochaEvents, null , 2))
            // console.log(sanitizedMochaEvents)
            // const [f, ...rest] = [...args]
            // console.log(f, 'rest', [...rest])
            // expect(f).to.eq('runner:start')

            // console.log(...args)
          })
        })
      })
    })
  })
})

// mocha:start
// mocha:suite 
// mocha:suite 
// mocha:hook
// mocha test:before:run
// mocha fail
// mocha suite end 
// mocha test end 
// mocha test:after:run
// mocha suite end 
// mocha end 

// - runner:test:before:run:async
// - runner:runnable:after:run:async

// runner:start
// runner:suite:start 
// runner:suite:start
// runner:hook:start 
// runner:test:before:run 
// - runner:test:before:run:async
// - runner:runnable:after:run:async
// runner:fail
// runner:suite:end
// runner:test:end
// runner:test:after:run
// runner:suite:end
// runner:end