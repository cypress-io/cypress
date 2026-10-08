import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import api from '../../../lib/cloud/api'
import { cache } from '../../../lib/cache'
import user from '../../../lib/cloud/user'

describe('lib/cloud/user', () => {
  beforeEach(async () => {
    await cache.remove()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('.get', () => {
    it('calls cache.getUser', () => {
      vi.spyOn(cache, 'getUser').mockResolvedValue({ name: 'brian' })

      return user.get().then((user) => {
        expect(user).toStrictEqual({ name: 'brian' })
      })
    })
  })

  describe('.logOut', () => {
    it('calls api.postLogout + removes the session from cache', () => {
      vi.spyOn(api, 'postLogout').mockResolvedValue(undefined)
      vi.spyOn(cache, 'getUser').mockResolvedValue({ name: 'brian', authToken: 'abc-123' })
      vi.spyOn(cache, 'removeUser')

      return user.logOut().then(() => {
        expect(cache.removeUser).toHaveBeenCalledOnce()
      })
    })

    it('does not send to api.postLogout without a authToken', () => {
      vi.spyOn(api, 'postLogout')
      vi.spyOn(cache, 'getUser').mockResolvedValue({ name: 'brian' })
      vi.spyOn(cache, 'removeUser')

      return user.logOut().then(() => {
        expect(api.postLogout).not.toHaveBeenCalled()

        expect(cache.removeUser).toHaveBeenCalledOnce()
      })
    })

    it('removes the session from cache even if api.postLogout rejects', () => {
      vi.spyOn(api, 'postLogout').mockRejectedValue(new Error('ECONNREFUSED'))
      vi.spyOn(cache, 'getUser').mockResolvedValue({ name: 'brian', authToken: 'abc-123' })
      vi.spyOn(cache, 'removeUser')

      return user.logOut().catch(() => {
        expect(cache.removeUser).toHaveBeenCalledOnce()
      })
    })
  })

  describe('.getBaseLoginUrl', () => {
    it('calls api.getAuthUrls', () => {
      vi.spyOn(api, 'getAuthUrls').mockResolvedValue({
        'dashboardAuthUrl': 'https://github.com/login',
      })

      return user.getBaseLoginUrl().then((url) => {
        expect(url).toBe('https://github.com/login')
      })
    })
  })

  describe('.getBaseSignupUrl', () => {
    it('returns dashboardSignupUrl from api.getAuthUrls', () => {
      vi.spyOn(api, 'getAuthUrls').mockResolvedValue({
        'dashboardSignupUrl': 'https://cloud.cypress.io/test-runner-signup?utm_source=Binary',
      })

      return user.getBaseSignupUrl().then((url) => {
        expect(url).toBe('https://cloud.cypress.io/test-runner-signup?utm_source=Binary')
      })
    })
  })
})
