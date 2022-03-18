import type { CypressInCypressMochaEvent } from '../../../../src/runner/event-manager'
import _ from 'lodash'
import type { MochaLifecycleData, SanitizedMochaLifecycleData } from './mochaTypes'
import EventEmitter from 'events'

const hooks = ['before all', 'before each', 'after all', 'after each'] as const

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
  sourceMappedStack: () => 'match.string',
  parsedStack: () => 'match.array',
  name: (n: string) => n === 'Error' ? 'AssertionError' : n,
  err: () => {
    return {
      message: '[error message]',
      name: 'AssertionError',
      stack: 'match.string',
      sourceMappedStack: 'match.string',
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

    for (const hook of hooks) {
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

    return sanitizedLifecycleData
  },
}

const keysToEliminate = ['codeFrame', '_testConfig'] as const

function removeUnusedKeysForTestSnapshot<T> (obj: T): T {
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

export function scaffoldCypressInCypressMochaEventsTest<T> (snapshots: T, snapToCompare: keyof T, done: Mocha.Done) {
  const bus = new EventEmitter()
  const outerRunner = window.top!.window

  outerRunner.bus = bus

  bus.on('assert:cypress:in:cypress', (snapshot: CypressInCypressMochaEvent[]) => {
    const expected = snapshots[snapToCompare]
    const diff = deepDiff(snapshot, expected)

    if (Object.keys(diff).length) {
      // useful for debugging
      console.error('snapshot:', JSON.stringify(snapshot, null, 2)) // eslint-disable-line no-console
      console.error('Expected snapshots to be identical, but they were not. Difference:', diff) // eslint-disable-line no-console
    }

    expect(Object.keys(diff).length).to.eq(0)
    done()
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

// https://gist.github.com/Yimiprod/7ee176597fef230d1451?permalink_comment_id=3415430#gistcomment-3415430
function deepDiff (fromObject: any, toObject: any) {
  const changes = {}

  const buildPath = (obj: any, key: string, path?: string) => {
    return _.isUndefined(path) ? key : `${path}.${key}`
  }

  const walk = (fromObject: any, toObject: any, path?: string) => {
    for (const key of _.keys(fromObject)) {
      const currentPath = buildPath(fromObject, key, path)

      if (!_.has(toObject, key)) {
        changes[currentPath] = { from: _.get(fromObject, key) }
      }
    }

    for (const [key, to] of _.entries(toObject)) {
      const currentPath = buildPath(toObject, key, path)

      if (!_.has(fromObject, key)) {
        changes[currentPath] = { to }
      } else {
        const from = _.get(fromObject, key)

        if (!_.isEqual(from, to)) {
          if (_.isObjectLike(to) && _.isObjectLike(from)) {
            walk(from, to, currentPath)
          } else {
            changes[currentPath] = { from, to }
          }
        }
      }
    }
  }

  walk(fromObject, toObject)

  return changes
}
