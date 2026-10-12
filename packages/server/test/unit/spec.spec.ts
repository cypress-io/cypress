import Bluebird from 'bluebird'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import spec from '../../lib/controllers/spec'
import preprocessor from '../../lib/plugins/preprocessor'

describe('lib/controllers/spec', () => {
  const specName = 'sample.js'
  const outputFilePath = 'foo/bar/sample.js'

  let res
  let onError
  let handle: (filePath: string, config?: Record<string, unknown>) => Bluebird<unknown>

  beforeEach(() => {
    res = {
      set: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
      sendFile: vi.fn(),
    }

    // The controller uses Bluebird's predicate `.catch`, which getFile's real return supports.
    vi.spyOn(preprocessor, 'getFile').mockImplementation(() => Bluebird.resolve(outputFilePath))
    onError = vi.fn()

    handle = (filePath, config = {}) => {
      return spec.handle(filePath, {} as any, res, config as any, (() => {}), onError)
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets the correct content type', () => {
    handle(specName)

    expect(res.type).toHaveBeenCalledOnce()
    expect(res.type).toHaveBeenCalledWith('js')
  })

  it('sends the file resolved from the preprocessor', () => {
    res.sendFile.mockImplementation((_filePath, cb) => cb())

    return handle(specName).then(() => {
      expect(res.sendFile).toHaveBeenCalledWith(outputFilePath, expect.any(Function))
    })
  })

  it('sends a client-side error in interactive mode', () => {
    vi.mocked(preprocessor.getFile).mockImplementation(() => Bluebird.reject(new Error('Reason request failed')))

    return handle(specName).then(() => {
      expect(res.send).toHaveBeenCalled()
      expect(res.send.mock.calls[0][0]).toContain('(function')
      expect(res.send.mock.calls[0][0]).toContain('Reason request failed')
    })
  })

  it('calls onError callback in run mode', () => {
    vi.mocked(preprocessor.getFile).mockImplementation(() => Bluebird.reject(new Error('Reason request failed')))

    return handle(specName, { isTextTerminal: true }).then(() => {
      expect(onError).toHaveBeenCalled()
      expect(onError.mock.lastCall[0].message).toContain('Oops...we found an error preparing this test file')
      expect(onError.mock.lastCall[0].message).toContain('Reason request failed')
    })
  })

  it('errors when sending file errors', () => {
    const sendFileErr = new Error('ENOENT')

    res.sendFile.mockImplementation((_filePath, cb) => cb(sendFileErr))

    return handle(specName).then(() => {
      expect(res.send.mock.calls[0][0]).toContain('(function')
      expect(res.send.mock.calls[0][0]).toContain('ENOENT')
    })
  })

  it('ignores ECONNABORTED errors', () => {
    const sendFileErr: NodeJS.ErrnoException = new Error('ECONNABORTED')

    sendFileErr.code = 'ECONNABORTED'

    res.sendFile.mockImplementation((_filePath, cb) => cb(sendFileErr))

    return handle(specName) // should resolve, not error
  })

  it('ignores EPIPE errors', () => {
    const sendFileErr: NodeJS.ErrnoException = new Error('EPIPE')

    sendFileErr.code = 'EPIPE'

    res.sendFile.mockImplementation((_filePath, cb) => cb(sendFileErr))

    return handle(specName) // should resolve, not error
  })
})
