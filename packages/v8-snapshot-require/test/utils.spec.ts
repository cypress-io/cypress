import { describe, it, expect, vi, afterEach } from 'vitest'
import path from 'path'

const loadForwardSlash = async (sep: string) => {
  vi.resetModules()
  vi.doMock('path', () => {
    const mocked = { ...path, sep }

    return { ...mocked, default: mocked }
  })

  const { forwardSlash } = await import('../src/utils')

  return forwardSlash
}

describe('forwardSlash', () => {
  afterEach(() => {
    vi.doUnmock('path')
    vi.resetModules()
  })

  it('collapses each run of backslashes into one forward slash on Windows', async () => {
    const forwardSlash = await loadForwardSlash('\\')

    expect(forwardSlash('node_modules\\debug\\src\\index.js')).toEqual('node_modules/debug/src/index.js')
    expect(forwardSlash('C:\\\\Users\\\\\\me\\file.js')).toEqual('C:/Users/me/file.js')
    expect(forwardSlash('\\\\server\\share')).toEqual('/server/share')
  })

  it('leaves forward slashes and other characters alone on Windows', async () => {
    const forwardSlash = await loadForwardSlash('\\')

    expect(forwardSlash('node_modules/debug/src/index.js')).toEqual('node_modules/debug/src/index.js')
    expect(forwardSlash('a\\b/c')).toEqual('a/b/c')
    expect(forwardSlash('a/\\b')).toEqual('a//b')
  })

  it('returns the path unchanged on POSIX', async () => {
    const forwardSlash = await loadForwardSlash('/')

    expect(forwardSlash('weird\\name/file.js')).toEqual('weird\\name/file.js')
  })
})
