import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activateAut, createTransientActivationRenewer } from '../../../src/cy/user-activation'

const createCypress = ({ userActivation = true, browser = 'chrome', automation = vi.fn().mockResolvedValue(undefined) } = {}) => {
  return {
    config: (key: 'userActivation') => key === 'userActivation' && userActivation,
    isBrowser: (matcher: 'webkit') => matcher === browser,
    automation,
  }
}

const createAutWindow = (isActive: boolean) => {
  return { navigator: { userActivation: { isActive } }, location: { href: 'http://localhost:3500/editor' } }
}

describe('src/cy/user-activation', () => {
  describe('createTransientActivationRenewer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renews before the first attempt, then at most once a second', async () => {
      const Cypress = createCypress()
      const renew = createTransientActivationRenewer(Cypress, createAutWindow(true))

      await renew()
      expect(renew()).toBeUndefined()

      vi.advanceTimersByTime(999)
      expect(renew()).toBeUndefined()

      vi.advanceTimersByTime(1)
      await renew()

      expect(Cypress.automation).toHaveBeenCalledTimes(2)
      expect(Cypress.automation).toHaveBeenCalledWith('activate:aut:frame', {})
    })

    it('leaves a command that runs within a second of the last activation the activation that is still active', async () => {
      const Cypress = createCypress()
      const autWindow = createAutWindow(true)

      await createTransientActivationRenewer(Cypress, autWindow)()
      vi.advanceTimersByTime(500)

      expect(createTransientActivationRenewer(Cypress, autWindow)()).toBeUndefined()
      expect(Cypress.automation).toHaveBeenCalledTimes(1)
    })

    it('renews within the second once the AUT has used the activation up', async () => {
      const Cypress = createCypress()
      const autWindow = createAutWindow(true)
      const renew = createTransientActivationRenewer(Cypress, autWindow)

      await renew()
      expect(renew()).toBeUndefined()

      autWindow.navigator.userActivation.isActive = false
      await renew()

      expect(Cypress.automation).toHaveBeenCalledTimes(2)
    })

    it('stops renewing for the command once a renewal fails, and lets the next command try', async () => {
      const Cypress = createCypress({ automation: vi.fn().mockRejectedValue(new Error('Cannot activate AUT frame: no AUT context initialized')) })
      const renew = createTransientActivationRenewer(Cypress, createAutWindow(false))

      await renew()
      vi.advanceTimersByTime(5000)

      expect(renew()).toBeUndefined()

      await createTransientActivationRenewer(Cypress, createAutWindow(false))()

      expect(Cypress.automation).toHaveBeenCalledTimes(2)
    })

    it('stops activating for the spec once the browser doesn\'t answer in time', async () => {
      const Cypress = createCypress({ automation: vi.fn().mockReturnValue(new Promise(() => {})) })
      const autWindow = createAutWindow(false)
      const renewing = createTransientActivationRenewer(Cypress, autWindow)()

      await vi.advanceTimersByTimeAsync(2000)
      await renewing

      vi.advanceTimersByTime(5000)

      expect(createTransientActivationRenewer(Cypress, autWindow)()).toBeUndefined()

      // a page load doesn't wait on it either
      await activateAut(Cypress, autWindow)

      expect(Cypress.automation).toHaveBeenCalledTimes(1)
    })

    it('asks again once the browser answers the request that timed out', async () => {
      let answer: (value?: unknown) => void = () => {}
      const automation = vi.fn()
      .mockReturnValueOnce(new Promise((resolve) => {
        answer = resolve
      }))
      .mockResolvedValue(undefined)
      const Cypress = createCypress({ automation })
      const autWindow = createAutWindow(false)
      const renewing = createTransientActivationRenewer(Cypress, autWindow)()

      await vi.advanceTimersByTimeAsync(500)
      await renewing

      expect(createTransientActivationRenewer(Cypress, autWindow)()).toBeUndefined()

      answer()
      await vi.advanceTimersByTimeAsync(0)
      await createTransientActivationRenewer(Cypress, autWindow)()

      expect(automation).toHaveBeenCalledTimes(2)
    })

    it('leaves a newer request\'s state alone when an older request fails afterwards', async () => {
      let fail: (err: Error) => void = () => {}
      const automation = vi.fn()
      .mockReturnValueOnce(new Promise((resolve, reject) => {
        fail = reject
      }))
      .mockResolvedValue(undefined)
      const Cypress = createCypress({ automation })
      const autWindow = createAutWindow(false)

      const older = createTransientActivationRenewer(Cypress, autWindow)()

      await createTransientActivationRenewer(Cypress, autWindow)()

      fail(new Error('Cannot activate AUT frame: no AUT context initialized'))
      await older

      autWindow.navigator.userActivation.isActive = true

      // the newer request's activation still counts, so this command doesn't renew
      expect(createTransientActivationRenewer(Cypress, autWindow)()).toBeUndefined()
      expect(automation).toHaveBeenCalledTimes(2)
    })

    it('does nothing with userActivation: false', () => {
      const Cypress = createCypress({ userActivation: false })

      expect(createTransientActivationRenewer(Cypress, createAutWindow(false))()).toBeUndefined()
      expect(Cypress.automation).not.toHaveBeenCalled()
    })

    it('does nothing in WebKit', () => {
      const Cypress = createCypress({ browser: 'webkit' })

      expect(createTransientActivationRenewer(Cypress, createAutWindow(false))()).toBeUndefined()
      expect(Cypress.automation).not.toHaveBeenCalled()
    })
  })
})
