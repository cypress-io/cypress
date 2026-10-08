import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import os from 'os'
import pkg from '@packages/root'
import Promise from 'bluebird'
import * as random from '../../../lib/util/random'
import auth from '../../../lib/cloud/auth'

// The SUT bare-requires ./user, ./machine_id and electron, so those resolve through node's
// require: install the ts hook and seed electron before the SUT loads, then stub the CJS instances.
const { requireCjs, electronPath, electron } = await vi.hoisted(async () => {
  const { createRequire } = await import('module')
  const requireCjs = createRequire(import.meta.url)

  requireCjs('@packages/ts/register')

  const electronPath = requireCjs.resolve('electron')
  const electron = requireCjs('../../support/helpers/electron_stub')

  requireCjs.cache[electronPath] = { exports: electron } as NodeModule

  return { requireCjs, electronPath, electron }
})

const user: typeof import('../../../lib/cloud/user').default = requireCjs('../../../lib/cloud/user').default
const machineId: typeof import('../../../lib/cloud/machine_id') = requireCjs('../../../lib/cloud/machine_id')

const BASE_URL = 'https://foo.invalid/login.html'
const RANDOM_STRING = 'a'.repeat(32)
const PORT = 9001
const REDIRECT_URL = `http://127.0.0.1:${PORT}/redirect-to-auth`
const FULL_LOGIN_URL = `https://foo.invalid/login.html?port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`
const FULL_LOGIN_URL_UTM = `https://foo.invalid/login.html?utm_source=UTM%20Source&utm_medium=UTM%20Medium&utm_campaign=Log%20In&utm_content=UTM%20Content&port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`
const FULL_SIGNUP_URL_UTM = `https://foo.invalid/login.html?utm_source=UTM%20Source&utm_medium=UTM%20Medium&utm_campaign=Sign%20Up&utm_content=UTM%20Content&port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`

describe('lib/cloud/auth', function () {
  beforeEach(() => {
    vi.spyOn(os, 'platform').mockReturnValue('linux')
    vi.spyOn(machineId, 'machineId').mockResolvedValue('abc123')
  })

  // Registered before the stopServer hook so mocks are restored only after the server stops
  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(function () {
    auth._internal.stopServer()
  })

  it('loads when electron cannot be resolved', async function () {
    const cached = requireCjs.cache[electronPath]

    requireCjs.cache[electronPath] = {
      get exports () {
        throw Object.assign(new Error('Cannot find module \'electron\''), { code: 'MODULE_NOT_FOUND' })
      },
    } as unknown as NodeModule

    try {
      vi.resetModules()
      const { default: authWithoutElectron } = await import('../../../lib/cloud/auth')

      expect(authWithoutElectron._internal.launchNativeAuth).toBeTypeOf('function')
    } finally {
      requireCjs.cache[electronPath] = cached
    }
  })

  describe('_internal.getOriginFromUrl', function () {
    it('given an https URL, returns the origin', function () {
      const origin = auth._internal.getOriginFromUrl(FULL_LOGIN_URL)

      expect(origin).toBe('https://foo.invalid')
    })

    it('given an http URL, returns the origin', function () {
      const origin = auth._internal.getOriginFromUrl('http://foo.invalid/login.html?abc=123&foo=bar')

      expect(origin).toBe('http://foo.invalid')
    })
  })

  describe('_internal.buildFullLoginUrl', function () {
    let server: { address: ReturnType<typeof vi.fn> }

    beforeEach(function () {
      vi.spyOn(random, 'id').mockReturnValue(RANDOM_STRING)
      server = {
        address: vi.fn(() => {
          return {
            port: PORT,
          }
        }),
      }
    })

    it('uses random and server.port to form a URL along with environment info', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, server)
      .then((url) => {
        expect(url).toBe(FULL_LOGIN_URL)
        expect(random.id).toHaveBeenCalledWith(32)
        expect(server.address).toHaveBeenCalledOnce()
      })
    })

    it('does not regenerate the state code', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, server)
      .then(() => {
        return auth._internal.buildFullLoginUrl(BASE_URL, server)
      })
      .then(() => {
        expect(random.id).toHaveBeenCalledOnce()
      })
    })

    it('uses utm code to form a trackable URL', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, server, 'UTM Source', 'UTM Medium', 'UTM Content')
      .then((url) => {
        expect(url).toBe(FULL_LOGIN_URL_UTM)
      })
    })

    it('uses signup utm campaign to form a trackable signup URL', function () {
      return auth._internal.buildFullSignupUrl(BASE_URL, server, 'UTM Source', 'UTM Medium', 'UTM Content')
      .then((url) => {
        expect(url).toBe(FULL_SIGNUP_URL_UTM)
      })
    })

    it('includes remoteOrigin in the auth URL when provided', function () {
      return auth._internal.buildFullSignupUrl(
        BASE_URL,
        server,
        'UTM Source',
        'UTM Medium',
        'UTM Content',
        'https://github.com/cypress-io/cypress.git',
      )
      .then((url) => {
        expect(url).toContain('remoteOrigin=')
        expect(decodeURIComponent(url)).toContain(
          'https://github.com/cypress-io/cypress.git',
        )
      })
    })

    it('includes remoteOrigin in the login URL when provided', function () {
      return auth._internal.buildFullLoginUrl(
        BASE_URL,
        server,
        'UTM Source',
        'UTM Medium',
        'UTM Content',
        'https://github.com/cypress-io/cypress.git',
      )
      .then((url) => {
        expect(url).toContain('remoteOrigin=')
        expect(decodeURIComponent(url)).toContain(
          'https://github.com/cypress-io/cypress.git',
        )
      })
    })
  })

  describe('_internal.launchNativeAuth', function () {
    it('is catchable if `shell` does not exist', function () {
      return auth._internal.launchNativeAuth(REDIRECT_URL)
      .then(() => {
        throw new Error('This should not succeed')
      })
      .catchReturn(TypeError)
    })

    describe('with `shell` available', function () {
      let oldOpenExternal

      beforeEach(function () {
        oldOpenExternal = electron.shell.openExternal
        electron.shell.openExternal = () => {}
      })

      afterEach(function () {
        electron.shell.openExternal = oldOpenExternal
      })

      it('returns a promise that is fulfilled when openExternal succeeds', function () {
        vi.spyOn(electron.shell, 'openExternal').mockResolvedValue(undefined)
        const sendWarning = vi.fn()

        return auth._internal.launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).toHaveBeenCalledWith(REDIRECT_URL)
          expect(sendWarning).not.toHaveBeenCalled()
        })
      })

      it('is still fulfilled when openExternal fails, but sendWarning is called', function () {
        vi.spyOn(electron.shell, 'openExternal').mockRejectedValue(new Error('Error'))
        const sendLaunchError = vi.fn()

        return auth._internal.launchNativeAuth(REDIRECT_URL, sendLaunchError)
        .then(() => {
          expect(electron.shell.openExternal).toHaveBeenCalledWith(REDIRECT_URL)
          expect(sendLaunchError).toHaveBeenCalledWith('AUTH_COULD_NOT_LAUNCH_BROWSER', REDIRECT_URL)
        })
      })
    })
  })

  describe('.start', () => {
    it('resolves upon successful auth', async () => {
      vi.spyOn(user, 'getBaseLoginUrl').mockResolvedValue('www.foo.bar')
      vi.spyOn(Promise, 'fromCallback').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'launchServer').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'buildLoginRedirectUrl').mockResolvedValue('www.redirect.url')
      vi.spyOn(auth._internal, 'launchNativeAuth').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'stopServer').mockImplementation(() => {})

      await auth.start(() => {}, 'code')

      expect(auth._internal.stopServer).toHaveBeenCalledOnce()
    })

    it('resolves upon successful signup auth', async () => {
      vi.spyOn(user, 'getBaseSignupUrl').mockResolvedValue('www.foo.bar')
      vi.spyOn(Promise, 'fromCallback').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'launchServer').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'buildLoginRedirectUrl').mockResolvedValue('www.redirect.url')
      vi.spyOn(auth._internal, 'launchNativeAuth').mockResolvedValue(undefined)
      vi.spyOn(auth._internal, 'stopServer').mockImplementation(() => {})

      await auth.startSignup(() => {}, 'code')

      expect(user.getBaseSignupUrl).toHaveBeenCalledOnce()
      expect(auth._internal.launchServer).toHaveBeenCalledWith('www.foo.bar', expect.any(Function), 'code', undefined, undefined, 'signup', undefined)
      expect(auth._internal.stopServer).toHaveBeenCalledOnce()
    })

    it('resolves when signup auth fails', async () => {
      vi.spyOn(user, 'getBaseSignupUrl').mockRejectedValue(new Error('test error'))
      vi.spyOn(auth._internal, 'stopServer').mockImplementation(() => {})

      await auth.startSignup(() => {}, 'code')
    })

    it('resolves when auth fails', async () => {
      vi.spyOn(user, 'getBaseLoginUrl').mockRejectedValue(new Error('test error'))
      vi.spyOn(auth._internal, 'stopServer').mockImplementation(() => {})

      await auth.start(() => {}, 'code')
    })

    it('sends an AUTH_ERROR_DURING_LOGIN message on unhandled errors', async () => {
      vi.spyOn(user, 'getBaseLoginUrl').mockResolvedValue('www.foo.bar')
      vi.spyOn(auth._internal, 'launchServer').mockRejectedValue(new Error('unexpected error'))

      const onMessageSpy = vi.fn()

      await auth.start(onMessageSpy, 'code')

      expect(onMessageSpy).toHaveBeenCalledWith({
        name: 'AUTH_ERROR_DURING_LOGIN',
        message: 'unexpected error',
        browserOpened: false,
      })
    })

    it('sends an AUTH_ERROR_DURING_LOGIN message on unhandled signup errors', async () => {
      vi.spyOn(user, 'getBaseSignupUrl').mockResolvedValue('www.foo.bar')
      vi.spyOn(auth._internal, 'launchServer').mockRejectedValue(new Error('unexpected error'))

      const onMessageSpy = vi.fn()

      await auth.startSignup(onMessageSpy, 'code')

      expect(onMessageSpy).toHaveBeenCalledWith({
        name: 'AUTH_ERROR_DURING_LOGIN',
        message: 'unexpected error',
        browserOpened: false,
      })
    })
  })
})
