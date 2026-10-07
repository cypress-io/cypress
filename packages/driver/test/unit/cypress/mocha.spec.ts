/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as mocha from 'mocha'

import $Mocha from '../../../src/cypress/mocha'
import { $Cy } from '../../../src/cypress/cy'

// In the browser bundle `mocha` exposes the Mocha constructor as `.Mocha`, which
// cypress/mocha.ts relies on to create its instance; mirror that shape here.
vi.mock('mocha', async (importOriginal) => {
  const original: any = await importOriginal()

  return { ...original, Mocha: original.default }
})

const Mocha = (mocha as any).Mocha != null ? (mocha as any).Mocha : mocha
const { Hook } = Mocha

const STOPPED = 'Cypress test was stopped while running this command.'

const neverSettles = () => new Promise(() => {})

// Runs the hook once and reports how it ended, or 'never finished' if mocha never called back.
const runOnce = (hook, waitMs = 300): Promise<string> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('never finished'), waitMs)

    hook.run((err) => {
      clearTimeout(timer)
      resolve(err ? err.message : 'finished')
    })
  })
}

describe('@packages/driver/src/cypress/mocha', () => {
  beforeEach(() => {
    const Cypress = {
      runner: {},
      spec: { relative: 'spec.cy.ts' },
      action: (_event, runnableRun, runnable, args) => runnableRun.apply(runnable, args),
    }

    ;(globalThis as any).Cypress = Cypress
    $Mocha.create({} as any, Cypress, () => 10000)
  })

  afterEach(() => {
    $Mocha.restore()
    delete (globalThis as any).Cypress
  })

  describe('a hook that timed out on the previous attempt', () => {
    it('finishes when it runs again', async () => {
      const hook = new Hook('"before each" hook', neverSettles)

      hook.timeout(20)

      expect(await runOnce(hook)).to.equal(STOPPED)
      expect(hook.timedOut).to.be.true

      hook.fn = () => Promise.resolve()

      expect(await runOnce(hook)).to.equal('finished')
    })

    it('can time out again when it runs again', async () => {
      const hook = new Hook('"before each" hook', neverSettles)

      hook.timeout(20)

      expect(await runOnce(hook)).to.equal(STOPPED)
      expect(await runOnce(hook)).to.equal(STOPPED)
    })
  })

  it('ignores a late completion from the attempt that already timed out', async () => {
    let settleLate: () => void = () => {}
    const hook = new Hook('"before each" hook', () => new Promise<void>((resolve) => settleLate = resolve))
    const onError = vi.fn()

    hook.on('error', onError)
    hook.timeout(20)

    expect(await runOnce(hook)).to.equal(STOPPED)

    settleLate()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(onError).not.toHaveBeenCalled()
  })

  describe('a late completion from a retried hook\'s timed-out attempt', () => {
    // Stands in for the cy instance, so each run goes through Cypress's real runnable
    // wrapper as it does in a spec.
    const makeCy = () => {
      const values: Record<string, unknown> = {}

      return {
        queue: { reset: vi.fn(), length: 0 },
        state (key: string, value?: unknown) {
          if (arguments.length === 2) {
            values[key] = value
          }

          return values[key]
        },
        config: () => undefined,
        isCy: () => false,
        doneEarly: vi.fn(),
        warnMixingPromisesAndCommands: vi.fn(),
        fail: (err: Error) => {
          throw err
        },
      }
    }

    const runAttempt = (hook, cy) => {
      $Cy.prototype.setRunnable.call(cy, hook, 'h1')

      return runOnce(hook)
    }

    it('does not fail the retry when a returned promise settles afterward', async () => {
      const cy = makeCy()
      let settleLate: () => void = () => {}
      const hook = new Hook('"before each" hook', () => new Promise<void>((resolve) => settleLate = resolve))
      const onError = vi.fn()

      hook.on('error', onError)
      hook.timeout(20)

      expect(await runAttempt(hook, cy)).to.equal(STOPPED)

      hook.fn = () => Promise.resolve()

      expect(await runAttempt(hook, cy)).to.equal('finished')

      settleLate()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(onError).not.toHaveBeenCalled()
    })

    it('ignores its done() while the retry is still running', async () => {
      const cy = makeCy()
      let lateDone: (err?: Error) => void = () => {}
      const hook = new Hook('"before each" hook', (done) => {
        lateDone = done
      })
      const onError = vi.fn()

      hook.on('error', onError)
      hook.timeout(20)

      expect(await runAttempt(hook, cy)).to.contain('never invoked')

      let releaseRetry: (err?: Error) => void = () => {}

      hook.timeout(1000)
      hook.fn = (done) => {
        releaseRetry = done
      }

      const retry = runAttempt(hook, cy)

      lateDone()

      expect(onError).not.toHaveBeenCalled()
      // a stale done() must not end the commands of the run that replaced it
      expect(cy.doneEarly).not.toHaveBeenCalled()

      releaseRetry()

      expect(await retry).to.equal('finished')
      expect(cy.doneEarly).toHaveBeenCalledOnce()

      lateDone()

      expect(onError).not.toHaveBeenCalled()
    })

    it('still fails the current run when its own returned promise rejects', async () => {
      const cy = makeCy()
      const hook = new Hook('"before each" hook', () => Promise.reject(new Error('boom')))

      expect(await runAttempt(hook, cy)).to.equal('boom')
    })
  })

  it('still reports done() called twice in the current attempt', async () => {
    const hook = new Hook('"before each" hook', (done) => {
      done()
      done()
    })
    const onError = vi.fn()

    hook.on('error', onError)

    expect(await runOnce(hook)).to.equal('finished')
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).to.contain('done() called multiple times')
  })
})
