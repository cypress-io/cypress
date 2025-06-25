/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, Mock, MockedObject } from 'vitest'
import { getUrlFromAutomation, UrlNotYetAvailableError } from '../../../../../src/cy/commands/helpers/location'
import Bluebird from 'bluebird'

const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve)
  })
}

describe('cy/commands/helpers/location', () => {
  let log: Mock<typeof Cypress['log']>
  let mockCypress: MockedObject<Cypress.Cypress>
  let mockLogReturnValue: Cypress.Log
  let mockContext: MockedObject<any>

  beforeEach(() => {
    log = vi.fn<typeof Cypress['log']>()

    mockCypress = {
      // The overloads for `log` don't get applied correctly here
      log,
      automation: vi.fn(),
      // @ts-expect-error - Mock Cypress config object doesn't have all required properties
      config: vi.fn(),
    }

    mockLogReturnValue = {
      id: 'log_id',
      end: vi.fn(),
      error: vi.fn(),
      finish: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      snapshot: vi.fn(),
      _hasInitiallyLogged: false,
      groupEnd: vi.fn(),
    }

    mockCypress.log.mockReturnValue(mockLogReturnValue)

    mockContext = {
      set: vi.fn(),
    }
  })

  describe('getUrlFromAutomation', () => {
    describe('options', () => {
      it('sets correct timeout option if passed in', async () => {
        getUrlFromAutomation.call(mockContext, mockCypress, {
          timeout: 2000,
        })

        expect(mockContext.set).toHaveBeenCalledWith('timeout', 2000)
      })

      it('otherwise sets timeout to defaultCommandTimeout', async () => {
        mockCypress.config.mockImplementation((key) => {
        // @ts-expect-error
          if (key === 'defaultCommandTimeout') {
            return 1000
          }

          return undefined
        })

        getUrlFromAutomation.call(mockContext, mockCypress, {})

        expect(mockCypress.config).toHaveBeenCalledWith('defaultCommandTimeout')
        expect(mockContext.set).toHaveBeenCalledWith('timeout', 1000)
      })
    })

    describe('leveraging the automation client', () => {
      let mockOptions: Cypress.Loggable & Cypress.Timeoutable

      beforeEach(() => {
        mockOptions = {
          timeout: 1000,
          log: false,
        }
      })

      it('throws an error when the automation promise has not yet resolved', async () => {
        // @ts-expect-error
        mockCypress.automation.mockImplementation(() => {
          // no-op promise to simulate the waiting for the automation client
          return new Bluebird.Promise((resolve) => undefined)
        })

        const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

        expect(() => {
          fn()
        }).toThrow('URL is not yet available')

        expect(mockCypress.automation).toHaveBeenCalledWith('get:aut:url', {})
      })

      it('returns the url object when the automation promise is resolved', async () => {
        // @ts-expect-error
        mockCypress.automation.mockImplementation(() => {
          // no-op promise to simulate the waiting for the automation client
          return new Bluebird.Promise((resolve) => resolve('https://www.example.com#foobar'))
        })

        const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

        expect(() => {
          fn()
        }).toThrow()

        // flush the microtask queue so we have a url value next time we call fn()
        await flushPromises()

        const url = fn()

        expect(url).toEqual({
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
      })

      it('retries returning the url object after the automation promise is resolved and { retryAfterResolve: true } is passed', async () => {
        // @ts-expect-error
        mockCypress.automation.mockImplementationOnce(() => {
          // no-op promise to simulate the waiting for the automation client
          return new Bluebird.Promise((resolve) => resolve('https://www.example.com#foobar'))
        })

        // @ts-expect-error
        mockCypress.automation.mockImplementation(() => {
          // no-op promise to simulate the waiting for the automation client
          return new Bluebird.Promise((resolve) => resolve('https://www.foobar.com#foobar'))
        })

        const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

        expect(() => {
          fn({ retryAfterResolve: true })
        }).toThrow()

        // flush the microtask queue so we have a url value next time we call fn()
        await flushPromises()

        const url = fn({ retryAfterResolve: true })

        expect(url).toEqual({
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

        expect(() => {
          // in this case the fn will returned the cached url object until the new one is available
          fn({ retryAfterResolve: true })
        }).not.toThrow()

        // flush the microtask queue so we have a url value next time we call fn()
        await flushPromises()

        const url2 = fn({ retryAfterResolve: true })

        expect(url2).toEqual({
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
      })

      it('throws an error when the automation promise is rejected and propagates the error', async () => {
        // @ts-expect-error
        mockCypress.automation.mockImplementation(() => {
          // no-op promise to simulate the waiting for the automation client
          return new Bluebird.Promise((resolve, reject) => reject(new Error('The automation client threw an error')))
        })

        const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

        expect(() => {
          fn()
        }).toThrow()

        // flush the microtask queue so we have a url value next time we call fn()
        await flushPromises()

        expect(() => {
          fn()
        }).toThrow('The automation client threw an error')
      })

      describe('onFail', () => {
        it('retries when the onFail handler is called with a UrlNotYetAvailableError error', async () => {
          // when calling the onFail handler with acceptable errors, we will be retrying the automation client
          // for this test, the automation client will be called twice
          let automationCallCount = 0

          // @ts-expect-error
          mockCypress.automation.mockImplementation(() => {
            automationCallCount++

            // no-op promise to simulate the waiting for the automation client
            return new Bluebird.Promise((resolve) => resolve())
          })

          let onFailHandler: any

          mockContext.set.mockImplementation((key, value) => {
            if (key === 'onFail') {
              onFailHandler = value
            }
          })

          const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

          expect(() => {
            fn()
          }).toThrow()

          // flush the microtask queue so we have a url value next time we call fn()
          await flushPromises()

          expect(() => {
            onFailHandler(new UrlNotYetAvailableError())
          }).not.toThrow()

          expect(automationCallCount).toBe(2)
        })

        it('retries when the onFail handler is called with a UrlNotYetAvailableError error', async () => {
          // when calling the onFail handler with acceptable errors, we will be retrying the automation client
          // for this test, the automation client will be called twice
          let automationCallCount = 0

          // @ts-expect-error
          mockCypress.automation.mockImplementation(() => {
            automationCallCount++

            // no-op promise to simulate the waiting for the automation client
            return new Bluebird.Promise((resolve) => resolve())
          })

          let onFailHandler: any

          mockContext.set.mockImplementation((key, value) => {
            if (key === 'onFail') {
              onFailHandler = value
            }
          })

          const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

          expect(() => {
            fn()
          }).toThrow()

          // flush the microtask queue so we have a url value next time we call fn()
          await flushPromises()

          expect(() => {
            const mockAssertionError = new Error('The assertion failed')

            mockAssertionError.name = 'AssertionError'

            onFailHandler(mockAssertionError)
          }).not.toThrow()

          expect(automationCallCount).toBe(2)
        })

        it('fails when the onFail handler is called with an error that is not a UrlNotYetAvailableError or AssertionError', async () => {
          // when calling the onFail handler with unacceptable errrors, we will not be retrying the automation client
          // for this test, the automation client will be called once
          let automationCallCount = 0

          // @ts-expect-error
          mockCypress.automation.mockImplementation(() => {
            automationCallCount++

            // no-op promise to simulate the waiting for the automation client
            return new Bluebird.Promise((resolve) => resolve())
          })

          let onFailHandler: any

          mockContext.set.mockImplementation((key, value) => {
            if (key === 'onFail') {
              onFailHandler = value
            }
          })

          const fn = getUrlFromAutomation.call(mockContext, mockCypress, mockOptions)

          expect(() => {
            fn()
          }).toThrow()

          // flush the microtask queue so we have a url value next time we call fn()
          await flushPromises()

          expect(() => {
            const mockAssertionError = new Error('Something else')

            onFailHandler(mockAssertionError)
          }).toThrow('Something else')

          expect(automationCallCount).toBe(1)
        })
      })
    })
  })
})
