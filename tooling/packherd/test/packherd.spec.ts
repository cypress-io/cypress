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
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import path from 'path'

const MINIMAL_PROJECT = 'v8-snapshot/minimal'

const t = spok.adapters.chaiExpect(expect)

const pathRelativeToCwd = (projectBaseDir, ...pathComponentsRelativeToProjectBaseDir) => {
  return path.relative(process.cwd(), path.join(projectBaseDir, ...pathComponentsRelativeToProjectBaseDir))
}

describe('Packherd', () => {
  let projectBaseDir

  before(async () => {
    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    projectBaseDir = await Fixtures.scaffoldProject(MINIMAL_PROJECT)

    await FixturesScaffold.scaffoldProjectNodeModules(MINIMAL_PROJECT, false, true)
  })

  it('resolves paths relative to entry and creates entry content', async () => {
    const entryFile = require.resolve(path.join(projectBaseDir, 'entry.js'))
    const { meta, bundle } = await packherd({ entryFile })

    // eslint-disable-next-line no-console
    console.log(meta)

    spok(t, meta, {
      inputs: {
        [pathRelativeToCwd(projectBaseDir, 'node_modules', 'isobject', 'index.cjs.js')]: {
          bytes: spok.ge(200),
        },
        [pathRelativeToCwd(projectBaseDir, 'node_modules', 'tmpfile', 'index.js')]: {
          bytes: spok.ge(800),
        },
        [pathRelativeToCwd(projectBaseDir, 'entry.js')]: {
          bytes: spok.ge(100),
          imports: [
            {
              path: pathRelativeToCwd(projectBaseDir, 'node_modules', 'isobject', 'index.cjs.js'),
            },
            {
              path: pathRelativeToCwd(projectBaseDir, 'node_modules', 'tmpfile', 'index.js'),
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

    const entryFile = path.relative(projectBaseDir, require.resolve(path.join(projectBaseDir, 'entry.js')))
    const { meta, bundle } = await packherd({ entryFile, createBundle })

    spok(t, meta, metafile)

    expect(bundle).to.equal(bundleStub.contents)
  })
})
