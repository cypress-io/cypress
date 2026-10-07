import EE from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as util from '../../../../lib/plugins/util'
import * as preprocessor from '../../../../lib/plugins/child/preprocessor'

// NOTE: todo come back to this
describe.skip('lib/plugins/child/preprocessor', () => {
  let ipc: { send: Mock, on: Mock, removeListener: Mock }
  let invoke: Mock
  let ids
  let file
  let file2
  let wrapChildPromise

  const wrappedFile = (call: 'first' | 'last' = 'last') => {
    const calls = wrapChildPromise.mock.calls

    return (call === 'first' ? calls[0] : calls[calls.length - 1])[3][0]
  }

  const yieldPreprocessorClose = (...args: unknown[]) => {
    const calls = ipc.on.mock.calls.filter((call) => call[0] === 'preprocessor:close')

    if (!calls.length) {
      throw new Error('ipc.on was never called with \'preprocessor:close\'')
    }

    calls.forEach((call) => call[1](...args))
  }

  beforeEach(() => {
    ipc = {
      send: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    }

    invoke = vi.fn()
    ids = {}
    file = {
      filePath: 'file/path',
      outputPath: 'output/path',
      shouldWatch: true,
    }

    file2 = {
      filePath: 'file2/path',
      outputPath: 'output/path2',
      shouldWatch: true,
    }

    wrapChildPromise = vi.spyOn(util, 'wrapChildPromise').mockImplementation(() => {})

    return preprocessor.wrap(ipc, invoke, ids, [file])
  })

  afterEach(() => {
    vi.restoreAllMocks()

    return preprocessor._clearFiles()
  })

  it('passes through ipc, invoke function, and ids', () => {
    expect(wrapChildPromise).toHaveBeenCalledWith(ipc, invoke, ids, expect.anything())
  })

  it('passes through simple file values', () => {
    const wrapped = wrappedFile()

    expect(wrapped.filePath).toBe(file.filePath)
    expect(wrapped.outputPath).toBe(file.outputPath)

    expect(wrapped.shouldWatch).toBe(file.shouldWatch)
  })

  it('re-applies event emitter methods to file', () => {
    expect(wrappedFile()).toBeInstanceOf(EE)
  })

  it('sends \'preprocessor:rerun\' through ipc on \'rerun\' event', () => {
    const wrapped = wrappedFile()

    wrapped.emit('rerun')

    expect(ipc.send).toHaveBeenCalledWith('preprocessor:rerun', file.filePath)
  })

  it('emits \'close\' when ipc emits \'preprocessor:close\' with same file path', () => {
    const wrapped = wrappedFile()
    const handler = vi.fn()

    wrapped.on('close', handler)
    yieldPreprocessorClose(file.filePath)

    expect(handler).toHaveBeenCalled()
  })

  it('does not close file when ipc emits \'preprocessor:close\' with different file path', () => {
    const wrapped = wrappedFile()
    const handler = vi.fn()

    wrapped.on('close', handler)
    yieldPreprocessorClose('different/path')

    expect(handler).not.toHaveBeenCalled()
  })

  it('passes existing file if called again with same file path', () => {
    preprocessor.wrap(ipc, invoke, ids, [file])
    const file1 = wrappedFile('first')
    const fileAgain = wrappedFile('last')

    expect(file1).toBe(fileAgain)
  })

  it('deletes stored file objects on close(filePath)', () => {
    preprocessor.wrap(ipc, invoke, ids, [file2])
    yieldPreprocessorClose(file.filePath)
    const files = preprocessor._getFiles()

    expect(Object.keys(files).length).toBe(1)
    expect(files[file2.filePath]).toBeDefined()
    expect(files[file2.filePath]).not.toBeNull()

    expect(files[file.filePath]).toBeUndefined()
  })

  it('deletes all stored file objects on close()', () => {
    preprocessor.wrap(ipc, invoke, ids, [file2])
    yieldPreprocessorClose()
    const files = preprocessor._getFiles()

    expect(Object.keys(files).length).toBe(0)
  })
})
