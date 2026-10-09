import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as plugins from '../../lib/plugins'
import * as task from '../../lib/task'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const configFilePath = 'cypress.config.js'

// Mirrors sinon `withArgs(event).resolves(...)`: matches on the leading argument
// and answers 'result' for any event not listed.
function resolveByEvent (results: Record<string, unknown>) {
  vi.mocked(plugins.execute).mockImplementation(async (event: string) => {
    return event in results ? results[event] : 'result'
  })
}

describe('lib/task', () => {
  beforeEach(() => {
    vi.spyOn(plugins, 'execute').mockResolvedValue('result')
    vi.spyOn(plugins, 'has').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('executes the \'task\' plugin', () => {
    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).then(() => {
      expect(plugins.execute).toHaveBeenCalledWith('task', 'some:task', 'some:arg')
    })
  })

  it('resolves the result of the \'task\' plugin', () => {
    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).then((result) => {
      expect(result).toBe('result')
    })
  })

  it('throws if \'task\' event is not registered', () => {
    vi.mocked(plugins.has).mockReturnValue(false)

    return task.run(configFilePath, { timeout: 1000 } as any).catch((err) => {
      expect(err.message).toBe(`The 'task' event has not been registered in the setupNodeEvents method. You must register it before using cy.task()\n\nFix this in your setupNodeEvents method here:\n${configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves __cypress_unhandled__', () => {
    resolveByEvent({
      'task': '__cypress_unhandled__',
      '_get:task:keys': ['foo', 'bar'],
    })

    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).toBe(`The task 'some:task' was not handled in the setupNodeEvents method. The following tasks are registered: foo, bar\n\nFix this in your setupNodeEvents method here:\n${configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves undefined', () => {
    resolveByEvent({
      'task': undefined,
      '_get:task:body': 'function () {}',
    })

    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).toBe(`The task 'some:task' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.\n\nThe task handler was:\n\nfunction () {}\n\nFix this in your setupNodeEvents method here:\n${configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves undefined - without task body', () => {
    resolveByEvent({
      'task': undefined,
      '_get:task:body': '',
    })

    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).toBe(`The task 'some:task' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.\n\nFix this in your setupNodeEvents method here:\n${configFilePath}`)
    })
  })

  it('throws if it times out', () => {
    resolveByEvent({
      'task': delay(250),
      '_get:task:body': 'function () {}',
    })

    return task.run(configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 10 }).catch((err) => {
      expect(err.message).toBe(`The task handler was:\n\nfunction () {}\n\nFix this in your setupNodeEvents method here:\n${configFilePath}`)
    })
  })
})
