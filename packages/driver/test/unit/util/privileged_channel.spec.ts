import { afterEach, describe, expect, it, vi } from 'vitest'

import { runPrivilegedFileCommand } from '../../../src/util/privileged_channel'

const createCy = (args: string[]) => {
  return {
    state: vi.fn().mockImplementation((key) => {
      if (key !== 'current') return

      return {
        get: vi.fn().mockImplementation((property) => {
          if (property !== 'privilegeVerification') return

          return [{ args, promise: Promise.resolve() }]
        }),
      }
    }),
  }
}

const createCypress = () => {
  return {
    Buffer,
    config: vi.fn().mockImplementation((key) => {
      if (key === 'namespace') return '__cypress'

      return
    }),
  }
}

const createStreamedResponse = (chunks: Uint8Array[], filePath: string) => {
  return new Response(new ReadableStream({
    start (controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk))
      controller.close()
    },
  }), {
    headers: {
      'x-cypress-file-path': encodeURIComponent(filePath),
    },
    status: 200,
  })
}

const createResponseWithoutFilePath = (body: BodyInit) => {
  return new Response(body, { status: 200 })
}

describe('runPrivilegedFileCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should combine streamed binary chunks into a Buffer', async () => {
    const fetchStub = vi.fn().mockResolvedValue(createStreamedResponse([
      Uint8Array.from([102, 111]),
      Uint8Array.from([111, 98, 97, 114]),
    ], '/path/to/foo.txt'))

    vi.stubGlobal('fetch', fetchStub)

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['123']),
      Cypress: createCypress(),
      options: {
        encoding: null,
        file: 'foo.txt',
      },
    })

    expect(result).toEqual({
      contents: Buffer.from('foobar'),
      filePath: '/path/to/foo.txt',
    })

    expect(fetchStub).toHaveBeenCalledWith(
      '/__cypress/privileged-commands/read-file',
      expect.objectContaining({
        body: JSON.stringify({
          args: ['123'],
          commandName: 'readFile',
          options: {
            encoding: null,
            file: 'foo.txt',
          },
        }),
        method: 'POST',
      }),
    )
  })

  it('should parse streamed JSON files using the requested encoding', async () => {
    const encoder = new TextEncoder()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createStreamedResponse([
      encoder.encode('{"foo":'),
      encoder.encode('1,"bar":"baz"}'),
    ], '/path/to/data.json')))

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['456']),
      Cypress: createCypress(),
      options: {
        encoding: 'utf8',
        file: 'data.json',
      },
    })

    expect(result).toEqual({
      contents: {
        bar: 'baz',
        foo: 1,
      },
      filePath: '/path/to/data.json',
    })
  })

  it('should use the original file path when the response header is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createResponseWithoutFilePath(Buffer.from('hello world')),
      ),
    )

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['789']),
      Cypress: createCypress(),
      options: {
        encoding: null,
        file: 'percent%file.txt',
      },
    })

    expect(result).toEqual({
      contents: Buffer.from('hello world'),
      filePath: 'percent%file.txt',
    })
  })
})
