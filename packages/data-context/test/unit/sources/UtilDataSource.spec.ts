import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import fetch from 'cross-fetch'
import { createTestDataContext } from '../helper'
import { UtilDataSource } from '../../../src/sources/UtilDataSource'
import type { DataContext } from '../../../src'
import { strictAgent } from '@packages/network'

// Mock cross-fetch
jest.mock('cross-fetch')
const mockedFetch = jest.mocked(fetch)

describe('UtilDataSource', () => {
  let ctx: DataContext
  let utilDataSource: UtilDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    utilDataSource = new UtilDataSource(ctx)

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    ctx.destroy()
  })

  describe('#fetch', () => {
    it('calls fetch with strictAgent and provided options', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn<Response['json']>().mockResolvedValue({ data: 'test' }),
      } as any

      mockedFetch.mockResolvedValue(mockResponse)

      const url = 'https://example.com/api'
      const init = { method: 'POST', body: 'test' }

      const result = await utilDataSource.fetch(url, init)

      expect(mockedFetch).toHaveBeenCalledWith(url, {
        // @ts-expect-error - agent is a node-fetch option that cross-fetch's RequestInit doesn't declare
        agent: strictAgent,
        method: 'POST',
        body: 'test',
      })

      expect(result).toBe(mockResponse)
    })

    it('calls fetch with only strictAgent when no init options provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn<Response['json']>().mockResolvedValue({ data: 'test' }),
      } as any

      mockedFetch.mockResolvedValue(mockResponse)

      const url = 'https://example.com/api'

      const result = await utilDataSource.fetch(url)

      expect(mockedFetch).toHaveBeenCalledWith(url, {
        // @ts-expect-error - agent is a node-fetch option that cross-fetch's RequestInit doesn't declare
        agent: expect.any(Object), // strictAgent
      })

      expect(result).toBe(mockResponse)
    })

    it('merges init options with agent configuration', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as any

      mockedFetch.mockResolvedValue(mockResponse)

      const url = 'https://example.com/api'
      const init = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      }

      await utilDataSource.fetch(url, init)

      expect(mockedFetch).toHaveBeenCalledWith(url, {
        // @ts-expect-error - agent is a node-fetch option that cross-fetch's RequestInit doesn't declare
        agent: strictAgent,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      })
    })
  })
})
