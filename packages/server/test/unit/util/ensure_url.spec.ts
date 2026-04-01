import net from 'net'

import { agent, connect } from '@packages/network'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isListening } from '../../../lib/util/ensure-url'

const dummyAddress: net.Address = {
  address: '127.0.0.1',
  family: 4,
}

describe('lib/util/ensure-url', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('.isListening', () => {
    beforeEach(() => {
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('resolves if a URL connects', async () => {
      const stub = vi.spyOn(connect, 'getAddress').mockImplementation((port, host) => {
        if (port === 80 && host === 'foo.bar.invalid') {
          return Promise.resolve(dummyAddress)
        }

        return Promise.reject(new Error('unexpected getAddress args'))
      })

      await isListening('http://foo.bar.invalid')

      expect(stub).toHaveBeenCalledTimes(1)
    })

    it(`rejects if a URL doesn't connect`, async () => {
      const stub = vi.spyOn(connect, 'getAddress').mockImplementation((port, host) => {
        if (port === 80 && host === 'foo.bar.invalid') {
          return Promise.reject(new Error('connect failed'))
        }

        return Promise.reject(new Error('unexpected getAddress args'))
      })

      await expect(isListening('http://foo.bar.invalid')).rejects.toThrow('connect failed')

      expect(stub).toHaveBeenCalledTimes(1)
    })
  })

  describe('with a proxy', () => {
    let oldEnv: NodeJS.ProcessEnv

    beforeEach(() => {
      oldEnv = Object.assign({}, process.env)
    })

    afterEach(() => {
      process.env = oldEnv
    })

    it('calls into the agent to check availability', async () => {
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://localhost:12345'
      process.env.NO_PROXY = ''

      vi.spyOn(agent, 'addRequest').mockImplementation(() => {
        throw new Error('agent addRequest')
      })

      nock.enableNetConnect()

      await expect(isListening('http://foo.bar.invalid')).rejects.toThrow()

      expect(agent.addRequest).toHaveBeenCalledTimes(1)
      expect(agent.addRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          href: 'http://foo.bar.invalid/',
        }),
      )
    })
  })
})
