/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { urlQueryCommand, hashQueryCommand, locationQueryCommand } from '../../../../src/cy/commands/location'
import { getUrlFromAutomation } from '../../../../src/cy/commands/helpers/location'
import type { $Cy } from '../../../../src/cypress/cy'

vi.mock('../../../../src/cy/commands/helpers/location', async () => {
  return {
    getUrlFromAutomation: vi.fn(),
  }
})

describe('cy/commands/location', () => {
  let mockCypress: MockedObject<Cypress.Cypress>
  let mockCy: MockedObject<$Cy>
  let mockContext: MockedObject<any>

  beforeEach(() => {
    mockCypress = {
      log: vi.fn(),
      automation: vi.fn(),
      isBrowser: vi.fn(),
      ensure: {
        // @ts-expect-error
        commandCanCommunicateWithAUT: vi.fn(),
      },
      // @ts-expect-error
      config: vi.fn(),
    }

    // @ts-expect-error
    mockCy = {
      getRemoteLocation: vi.fn(),
    }

    mockContext = {
      set: vi.fn(),
    }

    //@ts-expect-error
    getUrlFromAutomation.mockReset()
  })

  describe('url', () => {
    describe('chromium/firefox', () => {
      it('returns the url href from the automation client', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            href: 'https://www.example.com/#foobar',
          }
        })

        const url = urlQueryCommand.call(mockContext, mockCypress, mockCy, {})()

        expect(url).toBe('https://www.example.com/#foobar')

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()

        expect(mockCy.getRemoteLocation).not.toHaveBeenCalled()
      })

      it('supports the decode option', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            href: 'https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B',
          }
        })

        const url = urlQueryCommand.call(mockContext, mockCypress, mockCy, {
          decode: true,
        })()

        expect(url).toBe('https://mozilla.org/?x=шеллы')

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()
      })
    })

    describe('webkit', () => {
      beforeEach(() => {
        mockCypress.isBrowser.mockImplementation((browserName) => {
          if (browserName === 'webkit') {
            return true
          }

          return false
        })
      })

      it('does not use the automation client if the browser is webkit', () => {
        mockCy.getRemoteLocation.mockImplementation(() => {
          return 'https://www.example.com/#foobar'
        })

        const url = urlQueryCommand.call(mockContext, mockCypress, mockCy, { timeout: 10000 })()

        expect(url).toBe('https://www.example.com/#foobar')

        // @ts-expect-error
        expect(mockCypress.ensure.commandCanCommunicateWithAUT).toHaveBeenCalledOnce()

        expect(mockContext.set).toHaveBeenCalledWith('timeout', 10000)

        expect(getUrlFromAutomation).not.toHaveBeenCalled()

        expect(mockCy.getRemoteLocation).toHaveBeenCalledWith('href')
      })

      it('supports the decode option', () => {
        mockCy.getRemoteLocation.mockImplementation(() => {
          return 'https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B'
        })

        const url = urlQueryCommand.call(mockContext, mockCypress, mockCy, {
          decode: true,
        })()

        expect(url).toBe('https://mozilla.org/?x=шеллы')

        // @ts-expect-error
        expect(mockCypress.ensure.commandCanCommunicateWithAUT).toHaveBeenCalledOnce()

        expect(getUrlFromAutomation).not.toHaveBeenCalled()

        expect(mockCy.getRemoteLocation).toHaveBeenCalledWith('href')
      })
    })
  })

  describe('hash', () => {
    describe('chromium/firefox', () => {
      it('returns the hash of the url from the automation client', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            hash: 'foobar',
          }
        })

        const hash = hashQueryCommand.call(mockContext, mockCypress, mockCy, {})()

        expect(hash).toBe('foobar')

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()

        expect(mockCy.getRemoteLocation).not.toHaveBeenCalled()
      })
    })

    describe('webkit', () => {
      beforeEach(() => {
        mockCypress.isBrowser.mockImplementation((browserName) => {
          if (browserName === 'webkit') {
            return true
          }

          return false
        })
      })

      it('does not use the automation client if the browser is webkit', () => {
        mockCy.getRemoteLocation.mockImplementation(() => {
          return 'foobar'
        })

        const hash = hashQueryCommand.call(mockContext, mockCypress, mockCy, { timeout: 10000 })()

        expect(hash).toBe('foobar')

        // @ts-expect-error
        expect(mockCypress.ensure.commandCanCommunicateWithAUT).toHaveBeenCalledOnce()

        // @ts-expect-error
        expect(mockContext.set).toHaveBeenCalledWith('timeout', 10000)

        expect(getUrlFromAutomation).not.toHaveBeenCalled()

        expect(mockCy.getRemoteLocation).toHaveBeenCalledWith('hash')
      })
    })
  })

  describe('location', () => {
    describe('chromium/firefox', () => {
      it('returns the location of the url from the automation client', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            protocol: 'https:',
            host: 'www.example.com',
            hostname: 'www.example.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.example.com',
            href: 'https://www.example.com/#foobar',
            searchParams: expect.any(Object),
          }
        })

        const urlObj = locationQueryCommand.call(mockContext, mockCypress, mockCy, undefined, {})()

        expect(urlObj).toEqual({
          protocol: 'https:',
          host: 'www.example.com',
          hostname: 'www.example.com',
          hash: '#foobar',
          search: '',
          pathname: '/',
          port: '',
          origin: 'https://www.example.com',
          href: 'https://www.example.com/#foobar',
          searchParams: expect.any(Object),
        })

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()

        expect(mockCypress.log).toHaveBeenCalledWith({
          message: '',
          hidden: false,
          timeout: undefined,
        })

        expect(mockCy.getRemoteLocation).not.toHaveBeenCalled()
      })

      it('works with a string key', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            protocol: 'https:',
            host: 'www.example.com',
            hostname: 'www.example.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.example.com',
            href: 'https://www.example.com/#foobar',
            searchParams: expect.any(Object),
          }
        })

        const hash = locationQueryCommand.call(mockContext, mockCypress, mockCy, 'hash', {})()

        expect(hash).toEqual('#foobar')

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()

        expect(mockCypress.log).toHaveBeenCalledWith({
          message: 'hash',
          hidden: false,
          timeout: undefined,
        })

        expect(mockCy.getRemoteLocation).not.toHaveBeenCalled()
      })

      it('returns null if the location is empty', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return ''
        })

        const urlObj = locationQueryCommand.call(mockContext, mockCypress, mockCy, undefined, {})()

        expect(urlObj).toEqual(null)

        expect(getUrlFromAutomation).toHaveBeenCalledOnce()

        expect(mockCypress.log).toHaveBeenCalledWith({
          message: '',
          hidden: false,
          timeout: undefined,
        })

        expect(mockCy.getRemoteLocation).not.toHaveBeenCalled()
      })

      it('throws if the string key is invalid', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValue(() => {
          return {
            protocol: 'https:',
            host: 'www.example.com',
            hostname: 'www.example.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.example.com',
            href: 'https://www.example.com/#foobar',
            searchParams: expect.any(Object),
          }
        })

        expect(() => {
          locationQueryCommand.call(mockContext, mockCypress, mockCy, 'doesnotexist', {})()
        }).toThrow('Location object does not have key: `doesnotexist`')
      })

      it('retries the command even after the location has resolved', () => {
        // @ts-expect-error
        getUrlFromAutomation.mockReturnValueOnce((opts) => {
          expect(opts).toEqual({ retryAfterResolve: true })

          return {
            protocol: 'https:',
            host: 'www.example.com',
            hostname: 'www.example.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.example.com',
            href: 'https://www.example.com/#foobar',
            searchParams: expect.any(Object),
          }
        })

        // @ts-expect-error
        getUrlFromAutomation.mockReturnValueOnce((opts) => {
          expect(opts).toEqual({ retryAfterResolve: true })

          return {
            protocol: 'https:',
            host: 'www.foobar.com',
            hostname: 'www.foobar.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.foobar.com',
            href: 'https://www.foobar.com/#foobar',
            searchParams: expect.any(Object),
          }
        })

        const urlObj = locationQueryCommand.call(mockContext, mockCypress, mockCy, undefined, {})()

        expect(urlObj).toEqual({
          protocol: 'https:',
          host: 'www.example.com',
          hostname: 'www.example.com',
          hash: '#foobar',
          search: '',
          pathname: '/',
          port: '',
          origin: 'https://www.example.com',
          href: 'https://www.example.com/#foobar',
          searchParams: expect.any(Object),
        })

        const urlObj2 = locationQueryCommand.call(mockContext, mockCypress, mockCy, undefined, {})()

        expect(urlObj2).toEqual({
          protocol: 'https:',
          host: 'www.foobar.com',
          hostname: 'www.foobar.com',
          hash: '#foobar',
          search: '',
          pathname: '/',
          port: '',
          origin: 'https://www.foobar.com',
          href: 'https://www.foobar.com/#foobar',
          searchParams: expect.any(Object),
        })

        expect(getUrlFromAutomation).toHaveBeenCalledTimes(2)
      })
    })

    describe('webkit', () => {
      beforeEach(() => {
        mockCypress.isBrowser.mockImplementation((browserName) => {
          if (browserName === 'webkit') {
            return true
          }

          return false
        })
      })

      it('does not use the automation client if the browser is webkit', () => {
        mockCy.getRemoteLocation.mockImplementation(() => {
          // NOTE: this is the legacy API of remote location, which is fairly close to that of the automation client
          return {
            auth: '',
            authObj: '',
            protocol: 'https:',
            host: 'www.example.com',
            hostname: 'www.example.com',
            hash: '#foobar',
            search: '',
            pathname: '/',
            port: '',
            origin: 'https://www.example.com',
            href: 'https://www.example.com/#foobar',
            superDomainOrigin: 'example.com',
            superDomain: 'example.com',
          }
        })

        const urlLegacyObj = locationQueryCommand.call(mockContext, mockCypress, mockCy, undefined, { timeout: 10000 })()

        expect(urlLegacyObj).toEqual({
          auth: '',
          authObj: '',
          protocol: 'https:',
          host: 'www.example.com',
          hostname: 'www.example.com',
          hash: '#foobar',
          search: '',
          pathname: '/',
          port: '',
          origin: 'https://www.example.com',
          href: 'https://www.example.com/#foobar',
          superDomainOrigin: 'example.com',
          superDomain: 'example.com',
        })

        // @ts-expect-error
        expect(mockCypress.ensure.commandCanCommunicateWithAUT).toHaveBeenCalledOnce()

        expect(mockContext.set).toHaveBeenCalledWith('timeout', 10000)

        expect(mockCypress.log).toHaveBeenCalledWith({
          message: '',
          hidden: false,
          timeout: 10000,
        })

        expect(getUrlFromAutomation).not.toHaveBeenCalled()

        expect(mockCy.getRemoteLocation).toHaveBeenCalledWith()
      })
    })
  })
})
