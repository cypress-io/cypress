import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Response } from 'cross-fetch'
import { fetch as fetchImpl, putFetch as putFetchImpl, postFetch as postFetchImpl } from '../../../../lib/cloud/network/fetch'
import { ParseError } from '../../../../lib/cloud/network/parse_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'

const { stubbedCrossFetch } = vi.hoisted(() => {
  return { stubbedCrossFetch: vi.fn() }
})

vi.mock('cross-fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cross-fetch')>()

  return { ...actual, default: stubbedCrossFetch }
})

describe('cloud/network/fetch', () => {
  const url = 'https://some.test/url'
  const jsonText = '{ "content": "json" }'
  const jsonObj = JSON.parse(jsonText)
  const nonJsonText = 'some text response'
  const badJsonErr = 'Unexpected token < in JSON at position 0'
  let resolveVal

  beforeEach(() => {
    stubbedCrossFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when fetch resolves', () => {
    beforeEach(() => {
      resolveVal = new Response()
      vi.spyOn(resolveVal, 'url', 'get').mockReturnValue(url)
      stubbedCrossFetch.mockResolvedValue(resolveVal)
    })

    describe('when fetch resolves with a json-parseable response', () => {
      beforeEach(() => {
        vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
        vi.spyOn(resolveVal, 'text').mockResolvedValue(jsonText)
      })

      describe('and parse is json', () => {
        it('resolves with the parsed object', async () => {
          const res = await fetchImpl<{ 'content': string }>(url, { parse: 'json' })

          expect(res).toBe(jsonObj)
        })
      })

      describe('and parse is text', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetchImpl(url, { parse: 'text' })

          expect(res).toBe(jsonText)
        })
      })
    })

    describe('when fetch resolves with a non-json-parseable response', () => {
      beforeEach(() => {
        vi.spyOn(resolveVal, 'json').mockRejectedValue(new Error(badJsonErr))
        vi.spyOn(resolveVal, 'text').mockResolvedValue(nonJsonText)
      })

      describe('and parse json is used', () => {
        it('throws a parse error', async () => {
          let err: any

          try {
            await fetchImpl(url, { parse: 'json' })
          } catch (e) {
            err = e
          }
          expect(err.message).toBe(badJsonErr)
          expect(ParseError.isParseError(err)).toBe(true)
        })
      })

      describe('and text parse is used', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetchImpl(url, { parse: 'text' })

          expect(res).toBe(nonJsonText)
        })
      })
    })

    describe('when fetch resolves with a response indicative of an http error', () => {
      beforeEach(() => {
        vi.spyOn(resolveVal, 'status', 'get').mockReturnValue(400)
        vi.spyOn(resolveVal, 'statusText', 'get').mockReturnValue('Bad Request')
        vi.spyOn(resolveVal, 'text').mockResolvedValue(`<error><ref>4125</ref><kind>BadRequest</kind></error>`)
        vi.spyOn(resolveVal, 'json').mockRejectedValue(badJsonErr)
      })

      it('throws an HttpError', async () => {
        let err

        try {
          await fetchImpl(url, { parse: 'text' })
        } catch (e) {
          err = e
        }
        expect(err).not.toBeUndefined()
        expect(HttpError.isHttpError(err)).toBe(true)
      })
    })
  })

  describe('when fetch rejects with a system error', () => {
    const networkErrMsg = 'Error: ECONNRESET'
    let err: Error & { code?: string } | undefined

    beforeEach(() => {
      err = new Error(networkErrMsg)

      err.code = 'ECONNRESET'
      stubbedCrossFetch.mockRejectedValue(err)
    })

    it('throws a SystemError', async () => {
      let err

      try {
        await fetchImpl(url, { parse: 'text' })
      } catch (e) {
        err = e
      }
      expect(SystemError.isSystemError(err)).toBe(true)
    })
  })

  describe('when fetch is provided with an abort signal, and rejects via signal', () => {
    let abortError
    let fetchError
    let mockAbortController
    let mockSignal

    beforeEach(() => {
      abortError = new Error('connection stall')
      fetchError = new Error('User aborted the request')
      mockAbortController = Object.create(AbortController.prototype)
      mockSignal = Object.create(AbortSignal.prototype)
      Object.defineProperty(mockAbortController, 'signal', { get: () => mockSignal })
      Object.defineProperty(mockSignal, 'aborted', { get: () => true })
      Object.defineProperty(mockSignal, 'reason', { get: () => abortError })

      stubbedCrossFetch.mockRejectedValue(fetchError)
    })

    it('rethrows the signal reason', async () => {
      let error: Error | undefined

      try {
        await fetchImpl(url, { parse: 'text', signal: mockSignal })
      } catch (e) {
        error = e
      }

      expect(error).toBe(abortError)
    })
  })

  describe('putFetch', () => {
    beforeEach(() => {
      resolveVal = new Response()
      stubbedCrossFetch.mockResolvedValue(resolveVal)
      vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
    })

    it('should call crossFetch with the correct options', async () => {
      const res = await putFetchImpl(url, { parse: 'json' })

      expect(res).toBe(jsonObj)
    })
  })

  describe('postFetch', () => {
    beforeEach(() => {
      resolveVal = new Response()
      stubbedCrossFetch.mockResolvedValue(resolveVal)
      vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
    })

    it('should call crossFetch with the correct options', async () => {
      const res = await postFetchImpl(url, { parse: 'json' })

      expect(res).toBe(jsonObj)
    })
  })
})
