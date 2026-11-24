import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getStartBundlePaths, loadStartBundle } from '../../../lib/util/start_bundle'

describe('lib/util/start_bundle', () => {
  let serverDir: string

  const writeBundle = (source: string) => fs.outputFile(getStartBundlePaths(serverDir).bundlePath, source)

  beforeEach(async () => {
    serverDir = await fs.mkdtemp(path.join(os.tmpdir(), 'start-bundle-'))
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    await fs.remove(serverDir)
  })

  it('runs the bundle as a module located at the bundle path', async () => {
    await fs.outputFile(path.join(serverDir, 'sibling.js'), `module.exports = 'sibling'`)
    await writeBundle(`module.exports = { filename: __filename, dirname: __dirname, sibling: require('./sibling') }`)

    const { bundlePath } = getStartBundlePaths(serverDir)

    expect(await loadStartBundle(serverDir)).toEqual({ filename: bundlePath, dirname: serverDir, sibling: 'sibling' })
  })

  it('supports dynamic import inside the bundle', async () => {
    await writeBundle(`module.exports = import('path').then((m) => m.sep)`)

    expect(await loadStartBundle(serverDir)).toEqual(path.sep)
  })

  it('reports stack positions relative to the bundle', async () => {
    await writeBundle(`\n  module.exports = new Error('here').stack`)

    const { bundlePath } = getStartBundlePaths(serverDir)

    expect(await loadStartBundle(serverDir)).toContain(`${bundlePath}:2:20`)
  })

  it('writes the code cache on exit when asked to', async () => {
    vi.stubEnv('CYPRESS_INTERNAL_WRITE_START_BUNDLE_CACHE', '1')
    const once = vi.spyOn(process, 'once')

    await writeBundle(`module.exports = 'ok'`)
    await loadStartBundle(serverDir)

    const writeCache = once.mock.calls.find(([event]) => event === 'exit')?.[1]

    expect(writeCache).toBeTypeOf('function')
    writeCache?.()

    expect((await fs.readFile(getStartBundlePaths(serverDir).cachePath)).length).toBeGreaterThan(0)
  })

  it('still runs the bundle when V8 rejects the code cache', async () => {
    await writeBundle(`module.exports = 'ok'`)
    await fs.outputFile(getStartBundlePaths(serverDir).cachePath, 'not a code cache')

    expect(await loadStartBundle(serverDir)).toEqual('ok')
  })
})
