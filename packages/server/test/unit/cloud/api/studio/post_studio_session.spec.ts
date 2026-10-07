// The SUT bare-requires lib/cloud/routes.ts, which only a ts require hook can load
import '@packages/ts/register'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SystemError } from '../../../../../lib/cloud/network/system_error'
import { ParseKinds } from '../../../../../lib/cloud/network/fetch'
import { postStudioSession } from '../../../../../lib/cloud/api/studio/post_studio_session'

const standardHeaders = {
  'x-os-name': 'test-os',
  'x-cypress-version': 'test-version',
  'x-machine-id': 'test-machine-id',
}

const { postFetchStub } = vi.hoisted(() => {
  return { postFetchStub: vi.fn() }
})

vi.mock('../../../../../lib/cloud/network/fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/cloud/network/fetch')>()

  return {
    ...actual,
    postFetch: postFetchStub,
  }
})

vi.mock('../../../../../lib/cloud/api/get_standard_headers', () => {
  return {
    getStandardHeaders: vi.fn(async () => standardHeaders),
  }
})

describe('postStudioSession', () => {
  beforeEach(() => {
    postFetchStub.mockReset()
  })

  it('should post a studio session', async () => {
    postFetchStub.mockResolvedValue({
      studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
      protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
    })

    const result = await postStudioSession({
      projectId: '12345',
    })

    expect(result).toEqual({
      studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
      protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
    })

    expect(postFetchStub).toHaveBeenCalledOnce()
    expect(postFetchStub).toHaveBeenCalledWith(
      'http://localhost:1234/studio/session',
      {
        parse: ParseKinds.JSON,
        headers: {
          'Content-Type': 'application/json',
          ...standardHeaders,
        },
        body: JSON.stringify({ projectSlug: '12345', studioMountVersion: 1, protocolMountVersion: 2 }),
      },
    )
  })

  it('should throw an error if we receive a retryable error more than twice', async () => {
    postFetchStub.mockRejectedValue(new SystemError(new Error('Failed to create studio session'), 'http://localhost:1234/studio/session', 'ECONNRESET', 100))

    await expect(postStudioSession({
      projectId: '12345',
    })).rejects.toThrow()

    expect(postFetchStub).toHaveBeenCalledTimes(3)
  })
})
