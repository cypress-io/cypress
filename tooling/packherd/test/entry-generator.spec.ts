import type { Metafile } from 'esbuild'
import { createBundle } from '../src/create-bundle'
import type {
  CreateBundle,
  CreateBundleOpts,
  CreateBundleOutputFile,
  CreateBundleResult,
} from '../src/packherd'
import { expect } from 'chai'
import { EntryGenerator } from '../src/generate-entry'
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import path from 'path'

const MINIMAL_PROJECT = 'v8-snapshot/minimal'

describe('Entry Generator', () => {
  let projectBaseDir

  before(async () => {
    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    projectBaseDir = await Fixtures.scaffoldProject(MINIMAL_PROJECT)

    await FixturesScaffold.scaffoldProjectNodeModules({ project: MINIMAL_PROJECT, updateLockFile: false, forceCopyDependencies: true })
  })

  it('resolves paths relative to entry and creates entry content', async () => {
    const entryFile = require.resolve(path.join(projectBaseDir, 'entry.js'))
    const generator = new EntryGenerator(createBundle, entryFile)
    const { paths, entry } = await generator.createEntryScript()

    expect(paths).to.deep.equal([
      'node_modules/isobject/index.cjs.js',
      'node_modules/tmpfile/index.js',
    ])

    expect(entry).to.equal(
      `// vim: set ft=text:
exports['./node_modules/isobject/index.cjs.js'] = require('./node_modules/isobject/index.cjs.js')
exports['./node_modules/tmpfile/index.js'] = require('./node_modules/tmpfile/index.js')`,
    )
  })

  it('creates custom bundle', async () => {
    const bundle: CreateBundleOutputFile = {
      contents: Buffer.from('// Unused bundle content', 'utf8'),
    }
    const metafile: Metafile = ({
      inputs: {
        'node_modules/foo/foo.js': {},
        'lib/bar.js': {},
        'node_modules/baz/baz.js': {},
      },
    } as unknown) as Metafile

    const createBundle: CreateBundle = (_opts: CreateBundleOpts) => {
      const result: CreateBundleResult = {
        warnings: [],
        outputFiles: [bundle],
        metafile,
      }

      return Promise.resolve(result)
    }

    const entryFile = require.resolve(path.join(projectBaseDir, 'entry.js'))
    const generator = new EntryGenerator(createBundle, entryFile)

    const oldWd = process.cwd()

    process.chdir(projectBaseDir)
    const { paths, entry } = await generator.createEntryScript()

    process.chdir(oldWd)

    expect(paths).to.deep.equal(
      ['node_modules/foo/foo.js', 'node_modules/baz/baz.js'].sort(),
    )

    expect(entry).to.equal(
      `// vim: set ft=text:
exports['./node_modules/baz/baz.js'] = require('./node_modules/baz/baz.js')
exports['./node_modules/foo/foo.js'] = require('./node_modules/foo/foo.js')`,
    )
  })
})
