import type { CypressInCypressMochaEvent } from '../../../../src/runner/event-manager'
import _ from 'lodash'
import type { MochaLifecycleData, SanitizedMochaLifecycleData } from './mochaTypes'
import EventEmitter from 'events'
import disparity from 'disparity'

const hooks = {
  before: ['before all', 'before each'],
  after: ['after each', 'after all'],
} as const

const stringifyShort = (obj: Record<string, any>) => {
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
  hooks: stringifyShort,
  body: () => '[body]',
  wallClockStartedAt: () => 'match.date',
  lifecycle: () => 'match.number',
  fnDuration: () => 'match.number',
  duration: () => 'match.number',
  afterFnDuration: () => 'match.number',
  wallClockDuration: () => 'match.number',
  stack: () => 'match.string',
  file: (arg: string) => arg ? 'relative/path/to/spec.js' : undefined,
  message: () => '[error message]',
  parsedStack: () => 'match.array',
  name: (n: string) => n === 'Error' ? 'AssertionError' : n,
  err: () => {
    return {
      message: '[error message]',
      name: 'AssertionError',
      stack: 'match.string',
      parsedStack: 'match.array',
    }
  },
  startTime: new Date(0),
  start: () => 'match.date',
  end: () => 'match.date',
  timings: (arg: MochaLifecycleData): SanitizedMochaLifecycleData => {
    let sanitizedLifecycleData: SanitizedMochaLifecycleData = {
      lifecycle: 'match.number',
    }

    for (const hook of hooks.before) {
      const hooksToSanitize = arg[hook]

      if (!hooksToSanitize) {
        continue
      }

      sanitizedLifecycleData[hook] = hooksToSanitize.map((oldHook) => {
        return {
          hookId: oldHook.hookId,
          fnDuration: 'match.number',
          afterFnDuration: 'match.number',
        }
      })
    }

    if (arg.test) {
      sanitizedLifecycleData.test = {
        fnDuration: 'match.number',
        afterFnDuration: 'match.number',
      }
    }

    for (const hook of hooks.after) {
      const hooksToSanitize = arg[hook]

      if (!hooksToSanitize) {
        continue
      }

      sanitizedLifecycleData[hook] = hooksToSanitize.map((oldHook) => {
        return {
          hookId: oldHook.hookId,
          fnDuration: 'match.number',
          afterFnDuration: 'match.number',
        }
      })
    }

    return sanitizedLifecycleData
  },
}

const keysToEliminate = ['codeFrame', '_testConfig'] as const

function removeUnusedKeysForTestSnapshot<T> (obj: T): T {
  // with experimental retries, mocha can fire a 'retry' event with an undefined error
  // this is expected
  if (obj === undefined) return obj

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

declare global {
  interface Window {
    bus: EventEmitter
  }
}

export function runCypressInCypressMochaEventsTest<T> (snapshots: T, snapToCompare: keyof T, done: Mocha.Done) {
  const bus = new EventEmitter()
  const outerRunner = window.top!.window

  outerRunner.bus = bus

  // TODO: Can we automate writing the snapshots to disk?
  // For some reason `cy.task('getSnapshot')` has problems when executed in
  // "cypress in cypress"
  bus.on('assert:cypress:in:cypress', (snapshot: CypressInCypressMochaEvent[]) => {
    const expected = snapshots[snapToCompare]
    const diff = disparity.unifiedNoColor(JSON.stringify(expected, null, 2), JSON.stringify(snapshot, null, 2), {})

    if (diff !== '') {
      /* eslint-disable no-console */
      console.info('Received snapshot:', JSON.stringify(snapshot, null, 2))

      return cy.fail(new Error(`The captured mocha events did not match the "${String(snapToCompare)}" snapshot.\n${diff}`), { async: false })
    }

    Cypress.log({
      name: 'assert',
      message: `The captured mocha events for the spec matched the "${String(snapToCompare)}" snapshot!`,
      state: 'passed',
    })

    return done()
  })

  const assertMatchingSnapshot = (win: Cypress.AUTWindow) => {
    win.getEventManager().on('cypress:in:cypress:run:complete', (args: CypressInCypressMochaEvent[]) => {
      const data = sanitizeMochaEvents(args)

      bus.emit('assert:cypress:in:cypress', data)
    })
  }

  return { assertMatchingSnapshot }
}

function sanitizeMochaEvents (args: CypressInCypressMochaEvent[]) {
  return args.map((mochaEvent) => {
    return mochaEvent.map((payload) => {
      if (typeof payload === 'string') {
        return payload
      }

      return removeUnusedKeysForTestSnapshot(payload)
    })
  })
}
