import {
  CreateBundle,
  CreateBundleOpts,
  CreateBundleResult,
  CreateBundleOutputFile,
  packherd,
} from '../src/packherd'
import { expect } from 'chai'
import type{ Metafile } from 'esbuild'
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import path from 'path'

const MINIMAL_PROJECT = 'v8-snapshot/minimal'

const pathRelativeToCwd = (projectBaseDir, ...pathComponentsRelativeToProjectBaseDir) => {
  return path.relative(process.cwd(), path.join(projectBaseDir, ...pathComponentsRelativeToProjectBaseDir)).split(path.sep).join(path.posix.sep)
}

describe('Packherd', () => {
  let projectBaseDir

  before(async () => {
    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    projectBaseDir = await Fixtures.scaffoldProject(MINIMAL_PROJECT)

    await FixturesScaffold.scaffoldProjectNodeModules({ project: MINIMAL_PROJECT, updateLockFile: false, forceCopyDependencies: true })
  })

  it('resolves paths relative to entry and creates entry content', async () => {
    const entryFile = require.resolve(path.join(projectBaseDir, 'entry.js'))
    const { meta, bundle } = await packherd({ entryFile })

    expect(Object.keys(meta.inputs)).to.deep.equal([
      pathRelativeToCwd(projectBaseDir, 'node_modules', 'isobject', 'index.cjs.js'),
      pathRelativeToCwd(projectBaseDir, 'node_modules', 'tmpfile', 'index.js'),
      pathRelativeToCwd(projectBaseDir, 'entry.js'),
    ])

    expect(meta.inputs[pathRelativeToCwd(projectBaseDir, 'node_modules', 'isobject', 'index.cjs.js')].bytes).to.be.gte(200)
    expect(meta.inputs[pathRelativeToCwd(projectBaseDir, 'node_modules', 'tmpfile', 'index.js')].bytes).to.be.gte(800)
    expect(meta.inputs[pathRelativeToCwd(projectBaseDir, 'entry.js')].bytes).to.be.gte(100)
    expect(meta.inputs[pathRelativeToCwd(projectBaseDir, 'entry.js')].imports).to.deep.equal([
      {
        kind: 'require-call',
        path: pathRelativeToCwd(projectBaseDir, 'node_modules', 'isobject', 'index.cjs.js'),
      },
      {
        kind: 'require-call',
        path: pathRelativeToCwd(projectBaseDir, 'node_modules', 'tmpfile', 'index.js'),
      },
    ])

    expect(bundle.length).to.be.gte(1700)
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

    expect(meta).to.deep.equal(metafile)
    expect(bundle).to.equal(bundleStub.contents)
  })
})
