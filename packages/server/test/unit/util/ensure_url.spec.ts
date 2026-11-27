import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { connect, agent } from '@packages/network'
import { isListening } from '../../../lib/util/ensure-url'
import nock from 'nock'

// Counts only the calls whose leading arguments match, ignoring the rest.
function callsWith (spy: MockInstance, ...args: unknown[]) {
  return spy.mock.calls.filter((call) => args.every((arg, i) => call[i] === arg))
}

function stubGetAddressFor (port: number, hostname: string, result: () => Promise<any>) {
  return vi.spyOn(connect, 'getAddress').mockImplementation((p, h) => {
    return p === port && h === hostname ? result() : undefined as any
  })
}

describe('lib/util/ensure-url', function () {
  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('.isListening', function () {
    it('resolves if a URL connects', function () {
      const stub = stubGetAddressFor(80, 'foo.bar.invalid', () => Promise.resolve() as any)

      return isListening('http://foo.bar.invalid')
      .then(() => {
        expect(callsWith(stub, 80, 'foo.bar.invalid')).toHaveLength(1)
      })
    })

    it(`rejects if a URL doesn't connect`, function () {
      const stub = stubGetAddressFor(80, 'foo.bar.invalid', () => Promise.reject(new Error('Error')))

      return isListening('http://foo.bar.invalid')
      .then(() => {
        const err: any = new Error('should not reach this')

        err.fromTest = true
      })
      .catch((e) => {
        if (e.fromTest) {
          throw e
        }

        expect(callsWith(stub, 80, 'foo.bar.invalid')).toHaveLength(1)
      })
    })
  })

  describe('with a proxy', function () {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('calls into the agent to check availability', function () {
      vi.stubEnv('HTTP_PROXY', 'http://localhost:12345')
      vi.stubEnv('HTTPS_PROXY', 'http://localhost:12345')
      vi.stubEnv('NO_PROXY', '')

      vi.spyOn(agent, 'addRequest').mockImplementation(() => {
        throw new Error()
      })

      nock.enableNetConnect()

      return isListening('http://foo.bar.invalid')
      .then(() => {
        throw new Error('should not succeed')
      })
      .catch(() => {
        expect(agent.addRequest).toHaveBeenCalledOnce()
        expect(agent.addRequest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
          href: 'http://foo.bar.invalid/',
        }))
      })
    })

    it('connects directly for URLs excluded from the proxy via NO_PROXY', function () {
      // localhost is the component testing dev server and is excluded from the
      // proxy by default - it should be verified via a direct TCP connection
      // instead of being routed through the proxy (#27990)
      vi.stubEnv('HTTP_PROXY', 'http://localhost:12345')
      vi.stubEnv('HTTPS_PROXY', 'http://localhost:12345')
      vi.stubEnv('NO_PROXY', 'localhost,127.0.0.1,::1')

      const addRequest = vi.spyOn(agent, 'addRequest').mockImplementation(() => {
        throw new Error()
      })
      const getAddress = stubGetAddressFor(8080, 'localhost', () => Promise.resolve() as any)

      return isListening('http://localhost:8080')
      .then(() => {
        expect(callsWith(getAddress, 8080, 'localhost')).toHaveLength(1)
        expect(addRequest).not.toHaveBeenCalled()
      })
    })
  })
})
