/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as mocha from 'mocha'

import $Mocha from '../../../src/cypress/mocha'

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
})
