import { afterEach, describe, expect, it, vi } from 'vitest'
import humanInterval from 'human-interval'
import _ from 'lodash'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { connect } from '@packages/network'
import * as protocol from '../../../lib/browsers/protocol'

describe('lib/browsers/protocol', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('._getDelayMsForRetry', () => {
    it('retries as expected for up to 50 seconds', () => {
      const log = vi.spyOn(console, 'log')

      let delays = []
      let delay: number
      let i = 0

      while ((delay = protocol._getDelayMsForRetry(i, 'foobrowser'))) {
        delays.push(delay)
        i++
      }

      expect(_.sum(delays)).toBe(humanInterval('50 seconds'))

      log.mock.calls.forEach((args, i) => {
        const line = stripAnsi(args[0])

        expect(line).toContain(`Still waiting to connect to Foobrowser, retrying in 1 second (attempt ${i + 18}/62)`)
      })

      expect(delays).toMatchSnapshot()
    })
  })

  describe('._connectAsync', () => {
    it('creates a retrying socket to test the connection', async function () {
      const end = vi.fn()

      vi.spyOn(connect, 'createRetryingSocket').mockImplementation((_opts, cb) => {
        cb(null, { end } as any)
      })

      const opts = {
        host: '127.0.0.1',
        port: 3333,
      }

      await protocol._connectAsync(opts)
      expect(end).toHaveBeenCalledOnce()
    })
  })
})
