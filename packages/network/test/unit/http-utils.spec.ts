import { describe, it, expect } from 'vitest'
import type { IncomingMessage } from 'http'
import { responseMustHaveEmptyBody } from '../../lib/http-utils'

const req = (method: string) => ({ method } as IncomingMessage)
const res = (statusCode?: number) => ({ statusCode } as IncomingMessage)

describe('lib/http-utils', () => {
  describe('.responseMustHaveEmptyBody', () => {
    it('is true for 1xx informational responses', () => {
      for (const statusCode of [100, 101, 102, 103]) {
        expect(responseMustHaveEmptyBody(req('GET'), res(statusCode))).to.equal(true)
      }
    })

    it('is true for 204 and 304 responses', () => {
      expect(responseMustHaveEmptyBody(req('GET'), res(204))).to.equal(true)
      expect(responseMustHaveEmptyBody(req('GET'), res(304))).to.equal(true)
    })

    it('is true for HEAD requests regardless of status', () => {
      expect(responseMustHaveEmptyBody(req('HEAD'), res(200))).to.equal(true)
    })

    it('is false for a normal 200 response', () => {
      expect(responseMustHaveEmptyBody(req('GET'), res(200))).to.equal(false)
    })
  })
})
