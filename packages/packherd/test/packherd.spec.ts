import {
  CreateBundle,
  CreateBundleOpts,
  CreateBundleResult,
  CreateBundleOutputFile,
  packherd,
} from '../src/packherd'
import { expect } from 'chai'
import spok from 'spok'
import type{ Metafile } from 'esbuild'

const t = spok.adapters.chaiExpect(expect)

describe('Packherd', () => {
  it('resolves paths relative to entry and creates entry content', async () => {
    const entryFile = require.resolve('../test/fixtures/minimal/entry.js')
    const { meta, bundle } = await packherd({ entryFile })

    spok(t, meta, {
      inputs: {
        'test/fixtures/minimal/node_modules/isobject/index.cjs.js': {
          bytes: spok.ge(200),
        },
        'test/fixtures/minimal/node_modules/tmpfile/index.js': {
          bytes: spok.ge(800),
        },
        'test/fixtures/minimal/entry.js': {
          bytes: spok.ge(100),
          imports: [
            {
              path: 'test/fixtures/minimal/node_modules/isobject/index.cjs.js',
            },
            {
              path: 'test/fixtures/minimal/node_modules/tmpfile/index.js',
            },
          ],
        },
      },
    })

    spok(t, bundle, { length: spok.ge(1700) })
  })

  it('create custom bundle', async () => {
    const bundleStub: CreateBundleOutputFile = {
      contents: Buffer.from('// Unused bundle content', 'utf8'),
    }
    const metafile: Metafile = ({
      inputs: {
        'test/fixtures/minimal/node_modules/foo/foo.js': { bytes: 111 },
        'test/fixtures/minimal/lib/bar.js': { bytes: 1 },
        'test/fixtures/minimal/node_modules/baz/baz.js': { bytes: 222 },
      },
    } as unknown) as Metafile

    const createBundle: CreateBundle = (_opts: CreateBundleOpts) => {
      const result: CreateBundleResult = {
        warnings: [],
        outputFiles: [bundleStub],
        metafile,
      }

      return Promise.resolve(result)
    }

    const entryFile = require.resolve('../test/fixtures/minimal/entry.js')
    const { meta, bundle } = await packherd({ entryFile, createBundle })

    spok(t, meta, metafile)

    expect(bundle).to.equal(bundleStub.contents)
  })
})
