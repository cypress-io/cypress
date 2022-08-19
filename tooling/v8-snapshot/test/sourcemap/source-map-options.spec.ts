// import spok from 'spok'
import path from 'path'
import { readSnapshotResult } from '../utils/bundle'
import { SnapshotGenerator } from '../../src/snapshot-generator'
import { expect } from 'chai'

function assertMappingUrl (sourcemapComment: string | undefined) {
  expect(sourcemapComment).to.equal('// #sourceMappingUrl=cache/snapshot.js.map')
}

function assertInlined (sourcemapComment: string | undefined) {
  expect(sourcemapComment?.startsWith(
    '//# sourceMappingURL=data:application/json;base64',
  ), 'sourceMappingUrl inlined').to.be.true
}

function assertEmbedded (snapshotAuxiliaryData: any) {
  expect(Object.keys(snapshotAuxiliaryData.sourceMap)).to.deep.equal([
    'version',
    'sources',
    'names',
    'mappings',
    'file',
    'sourceRoot',
    'sourcesContent',
  ])
}

const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'minimal')
const cacheDir = path.join(projectBaseDir, 'cache')
const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')

describe('sourcemap', () => {
  it('does not inline nor embed sourcemap', async () => {
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    const { snapshotAuxiliaryData, sourcemapComment } =
      readSnapshotResult(cacheDir)

    assertMappingUrl(sourcemapComment)
    expect(snapshotAuxiliaryData.sourceMap).to.be.undefined
  })

  it('inlines but not embed sourcemap', async () => {
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      sourcemapInline: true,
    })

    await generator.createScript()
    const { snapshotAuxiliaryData, sourcemapComment } =
      readSnapshotResult(cacheDir)

    assertInlined(sourcemapComment)

    expect(snapshotAuxiliaryData.sourceMap).to.be.undefined
  })

  it('embeds but does not inline sourcemap', async () => {
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      sourcemapEmbed: true,
    })

    await generator.createScript()
    const { snapshotAuxiliaryData, sourcemapComment } =
      readSnapshotResult(cacheDir)

    assertMappingUrl(sourcemapComment)
    assertEmbedded(snapshotAuxiliaryData)
  })

  it('embeds and inlines sourcemap', async () => {
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      sourcemapEmbed: true,
      sourcemapInline: true,
    })

    await generator.createScript()
    const { snapshotAuxiliaryData, sourcemapComment } =
      readSnapshotResult(cacheDir)

    assertInlined(sourcemapComment)
    assertEmbedded(snapshotAuxiliaryData)
  })
})
