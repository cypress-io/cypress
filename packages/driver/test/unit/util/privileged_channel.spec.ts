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
  const backend = vi.fn().mockResolvedValue({
    filePath: '/authorized/path/to/foo.txt',
    token: 'file-read-token',
  })

  return {
    Buffer,
    backend,
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

const createErrorResponse = (status: number, body: BodyInit) => {
  return new Response(body, {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

describe('runPrivilegedFileCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should combine streamed binary chunks into a Buffer', async () => {
    const Cypress = createCypress()
    const fetchStub = vi.fn().mockResolvedValue(createStreamedResponse([
      Uint8Array.from([102, 111]),
      Uint8Array.from([111, 98, 97, 114]),
    ], '/path/to/foo.txt'))

    vi.stubGlobal('fetch', fetchStub)
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['123']),
      Cypress,
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
      'http://localhost:1234/__cypress/privileged-commands/read-file',
      expect.objectContaining({
        body: JSON.stringify({
          token: 'file-read-token',
        }),
        method: 'POST',
      }),
    )

    expect(Cypress.backend).toHaveBeenCalledWith(
      'create:privileged:file:read',
      {
        args: ['123'],
        commandName: 'readFile',
        options: {
          file: 'foo.txt',
        },
      },
    )
  })

  it('should parse streamed JSON files using the requested encoding', async () => {
    const Cypress = createCypress()
    const encoder = new TextEncoder()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createStreamedResponse([
      encoder.encode('{"foo":'),
      encoder.encode('1,"bar":"baz"}'),
    ], '/path/to/data.json')))

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['456']),
      Cypress,
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

  it('should parse streamed JSON files with a utf8 byte order mark', async () => {
    const Cypress = createCypress()
    const encoder = new TextEncoder()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createStreamedResponse([
      encoder.encode('\uFEFF{"foo":'),
      encoder.encode('1}'),
    ], '/path/to/data.json')))

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['654']),
      Cypress,
      options: {
        encoding: 'utf8',
        file: 'data.json',
      },
    })

    expect(result).toEqual({
      contents: {
        foo: 1,
      },
      filePath: '/path/to/data.json',
    })
  })

  it('should use the authorized file path when the response header is absent', async () => {
    const Cypress = createCypress()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createResponseWithoutFilePath(Buffer.from('hello world')),
      ),
    )

    const result = await runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['789']),
      Cypress,
      options: {
        encoding: null,
        file: 'percent%file.txt',
      },
    })

    expect(result).toEqual({
      contents: Buffer.from('hello world'),
      filePath: '/authorized/path/to/foo.txt',
    })
  })

  it('should attach file path metadata to JSON parse errors', async () => {
    const Cypress = createCypress()
    const encoder = new TextEncoder()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createStreamedResponse([
      encoder.encode('{"foo":'),
      encoder.encode('}'),
    ], '/path/to/data.json')))

    await expect(runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['987']),
      Cypress,
      options: {
        encoding: 'utf8',
        file: 'data.json',
      },
    })).rejects.toMatchObject({
      filePath: '/path/to/data.json',
      originalFilePath: 'data.json',
    })
  })

  it('should throw backend errors from failed HTTP responses', async () => {
    const Cypress = createCypress()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createErrorResponse(
      500,
      JSON.stringify({
        error: {
          code: 'EISDIR',
          filePath: '/path/to/foo.txt',
          message: 'EISDIR: illegal operation on a directory, read',
          name: 'EISDIR',
        },
      }),
    )))

    await expect(runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['741']),
      Cypress,
      options: {
        encoding: null,
        file: 'foo.txt',
      },
    })).rejects.toMatchObject({
      code: 'EISDIR',
      filePath: '/path/to/foo.txt',
      message: 'EISDIR: illegal operation on a directory, read',
      name: 'EISDIR',
    })
  })

  it('should throw a default status error when the HTTP error body is invalid', async () => {
    const Cypress = createCypress()

    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:1234',
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', {
      status: 502,
    })))

    await expect(runPrivilegedFileCommand({
      commandName: 'readFile',
      cy: createCy(['852']),
      Cypress,
      options: {
        encoding: null,
        file: 'foo.txt',
      },
    })).rejects.toThrow('Privileged file read failed with status code 502')
  })
})
