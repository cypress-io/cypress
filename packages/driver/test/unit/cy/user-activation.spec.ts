import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTransientActivationRenewer } from '../../../src/cy/user-activation'

const createCypress = ({ userActivation = true, browser = 'chrome', automation = vi.fn().mockResolvedValue(undefined) } = {}) => {
  return {
    config: (key: 'userActivation') => key === 'userActivation' && userActivation,
    isBrowser: (matcher: 'webkit') => matcher === browser,
    automation,
  }
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
      const renew = createTransientActivationRenewer(Cypress, undefined)

      await renew()
      expect(renew()).toBeUndefined()

      vi.advanceTimersByTime(999)
      expect(renew()).toBeUndefined()

      vi.advanceTimersByTime(1)
      await renew()

      expect(Cypress.automation).toHaveBeenCalledTimes(2)
      expect(Cypress.automation).toHaveBeenCalledWith('activate:aut:frame', {})
    })

    it('renews within the second once the AUT has used the activation up', async () => {
      const Cypress = createCypress()
      const userActivation = { isActive: true }
      const renew = createTransientActivationRenewer(Cypress, { navigator: { userActivation } })

      await renew()
      expect(renew()).toBeUndefined()

      userActivation.isActive = false
      await renew()

      expect(Cypress.automation).toHaveBeenCalledTimes(2)
    })

    it('waits a second before renewing an activation the caller just gave', async () => {
      const Cypress = createCypress()
      const renew = createTransientActivationRenewer(Cypress, undefined, { justRenewed: true })

      expect(renew()).toBeUndefined()

      vi.advanceTimersByTime(1000)
      await renew()

      expect(Cypress.automation).toHaveBeenCalledTimes(1)
    })

    it('stops renewing for the command once a renewal fails', async () => {
      const Cypress = createCypress({ automation: vi.fn().mockRejectedValue(new Error('Cannot activate AUT frame: no AUT context initialized')) })
      const renew = createTransientActivationRenewer(Cypress, undefined)

      await renew()
      vi.advanceTimersByTime(5000)

      expect(renew()).toBeUndefined()
      expect(Cypress.automation).toHaveBeenCalledTimes(1)
    })

    it('stops renewing for the command once the browser doesn\'t answer in time', async () => {
      const Cypress = createCypress({ automation: vi.fn().mockReturnValue(new Promise(() => {})) })
      const renew = createTransientActivationRenewer(Cypress, undefined)

      const renewing = renew()

      await vi.advanceTimersByTimeAsync(2000)
      await renewing

      vi.advanceTimersByTime(5000)

      expect(renew()).toBeUndefined()
      expect(Cypress.automation).toHaveBeenCalledTimes(1)
    })

    it('does nothing with userActivation: false', () => {
      const Cypress = createCypress({ userActivation: false })

      expect(createTransientActivationRenewer(Cypress, undefined)()).toBeUndefined()
      expect(Cypress.automation).not.toHaveBeenCalled()
    })

    it('does nothing in WebKit', () => {
      const Cypress = createCypress({ browser: 'webkit' })

      expect(createTransientActivationRenewer(Cypress, undefined)()).toBeUndefined()
      expect(Cypress.automation).not.toHaveBeenCalled()
    })
  })
})
