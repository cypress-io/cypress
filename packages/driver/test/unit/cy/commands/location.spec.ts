/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { urlQueryCommand, hashQueryCommand, locationQueryCommand } from '../../../../src/cy/commands/location'
import { getUrlFromAutomation } from '../../../../src/cy/commands/helpers/location'

vi.mock('../../../../src/cy/commands/helpers/location', async () => {
  return {
    getUrlFromAutomation: vi.fn(),
  }
})

describe('cy/commands/location', () => {
  let mockCypress: MockedObject<Cypress.Cypress>
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

    mockContext = {
      set: vi.fn(),
    }

    //@ts-expect-error
    getUrlFromAutomation.mockReset()
  })

  describe('url', () => {
    it('returns the url href from the automation client', () => {
      // @ts-expect-error
      getUrlFromAutomation.mockReturnValue(() => {
        return {
          href: 'https://www.example.com/#foobar',
        }
      })

      expect(urlQueryCommand.call(mockContext, mockCypress, {})()).toBe('https://www.example.com/#foobar')

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()
    })

    it('supports the decode option', () => {
      // @ts-expect-error
      getUrlFromAutomation.mockReturnValue(() => {
        return {
          href: 'https://www.example.com/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B',
        }
      })

      const url = urlQueryCommand.call(mockContext, mockCypress, {
        decode: true,
      })()

      expect(url).toBe('https://www.example.com/?x=шеллы')

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()
    })
  })

  describe('hash', () => {
    it('returns the hash of the url from the automation client', () => {
      // @ts-expect-error
      getUrlFromAutomation.mockReturnValue(() => {
        return {
          hash: 'foobar',
        }
      })

      expect(hashQueryCommand.call(mockContext, mockCypress, {})()).toBe('foobar')

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()
    })
  })

  describe('location', () => {
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

      const expectedLocation = {
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

      expect(locationQueryCommand.call(mockContext, mockCypress, undefined, {})()).toEqual(expectedLocation)

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()

      expect(mockCypress.log).toHaveBeenCalledWith({
        message: '',
        hidden: false,
        timeout: undefined,
      })
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

      const hash = locationQueryCommand.call(mockContext, mockCypress, 'hash', {})()

      expect(hash).toEqual('#foobar')

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()

      expect(mockCypress.log).toHaveBeenCalledWith({
        message: 'hash',
        hidden: false,
        timeout: undefined,
      })
    })

    it('returns null if the location is empty', () => {
      // @ts-expect-error
      getUrlFromAutomation.mockReturnValue(() => {
        return ''
      })

      const urlObj = locationQueryCommand.call(mockContext, mockCypress, undefined, {})()

      expect(urlObj).toEqual(null)

      expect(getUrlFromAutomation).toHaveBeenCalledOnce()

      expect(mockCypress.log).toHaveBeenCalledWith({
        message: '',
        hidden: false,
        timeout: undefined,
      })
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
        locationQueryCommand.call(mockContext, mockCypress, 'doesnotexist', {})()
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

      const urlObj = locationQueryCommand.call(mockContext, mockCypress, undefined, {})()

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

      const urlObj2 = locationQueryCommand.call(mockContext, mockCypress, undefined, {})()

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
})
