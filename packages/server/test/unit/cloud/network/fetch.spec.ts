import { Response } from 'cross-fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpError } from '../../../../lib/cloud/network/http_error'
import { ParseError } from '../../../../lib/cloud/network/parse_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'

const crossFetchMock = vi.hoisted(() => vi.fn())

vi.mock('cross-fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cross-fetch')>()

  return {
    ...actual,
    default: crossFetchMock,
  }
})

import { fetch, postFetch, putFetch } from '../../../../lib/cloud/network/fetch'

describe('cloud/network/fetch', () => {
  const url = 'https://some.test/url'
  const jsonText = '{ "content": "json" }'
  const jsonObj = JSON.parse(jsonText)
  const nonJsonText = 'some text response'
  const badJsonErr = 'Unexpected token < in JSON at position 0'

  let resolveVal: Response

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when fetch resolves', () => {
    beforeEach(() => {
      resolveVal = new Response()
      vi.spyOn(resolveVal, 'url', 'get').mockReturnValue(url)
      crossFetchMock.mockResolvedValue(resolveVal)
    })

    describe('when fetch resolves with a json-parseable response', () => {
      beforeEach(() => {
        vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
        vi.spyOn(resolveVal, 'text').mockResolvedValue(jsonText)
      })

      describe('and parse is json', () => {
        it('resolves with the parsed object', async () => {
          const res = await fetch<{ 'content': string }>(url, { parse: 'json' })

          expect(res).toBe(jsonObj)
        })
      })

      describe('and parse is text', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetch(url, { parse: 'text' })

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
          await expect(fetch(url, { parse: 'json' })).rejects.toSatisfy((e: unknown) => {
            expect(e).toMatchObject({ message: badJsonErr })

            return ParseError.isParseError(e)
          })
        })
      })

      describe('and text parse is used', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetch(url, { parse: 'text' })

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
        await expect(fetch(url, { parse: 'text' })).rejects.toSatisfy((e: unknown) => HttpError.isHttpError(e))
      })
    })
  })

  describe('when fetch rejects with a system error', () => {
    const networkErrMsg = 'Error: ECONNRESET'

    beforeEach(() => {
      const err = new Error(networkErrMsg) as Error & { code?: string }

      err.code = 'ECONNRESET'
      crossFetchMock.mockRejectedValue(err)
    })

    it('throws a SystemError', async () => {
      await expect(fetch(url, { parse: 'text' })).rejects.toSatisfy((e: unknown) => SystemError.isSystemError(e))
    })
  })

  describe('when fetch is provided with an abort signal, and rejects via signal', () => {
    let abortError: Error
    let fetchError: Error
    let mockSignal: AbortSignal

    beforeEach(() => {
      abortError = new Error('connection stall')
      fetchError = new Error('User aborted the request')

      mockSignal = {
        get aborted () {
          return true
        },
        get reason () {
          return abortError
        },
      } as AbortSignal

      crossFetchMock.mockRejectedValue(fetchError)
    })

    it('rethrows the signal reason', async () => {
      await expect(fetch(url, { parse: 'text', signal: mockSignal })).rejects.toBe(abortError)
    })
  })

  describe('putFetch', () => {
    beforeEach(() => {
      resolveVal = new Response()
      crossFetchMock.mockResolvedValue(resolveVal)
      vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
    })

    it('should call crossFetch with the correct options', async () => {
      const res = await putFetch(url, { parse: 'json' })

      expect(res).toBe(jsonObj)
      expect(crossFetchMock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: 'PUT',
        }),
      )
    })
  })

  describe('postFetch', () => {
    beforeEach(() => {
      resolveVal = new Response()
      crossFetchMock.mockResolvedValue(resolveVal)
      vi.spyOn(resolveVal, 'json').mockResolvedValue(jsonObj)
    })

    it('should call crossFetch with the correct options', async () => {
      const res = await postFetch(url, { parse: 'json' })

      expect(res).toBe(jsonObj)
      expect(crossFetchMock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })
})
