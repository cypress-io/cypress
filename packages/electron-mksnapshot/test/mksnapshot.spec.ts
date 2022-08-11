import { syncAndRun } from '../src/mksnapshot'
import { expect } from 'chai'
import { track } from 'temp'
import path from 'path'
const { mkdirSync } = track()

const projectRootDir = path.join(__dirname, '..')
const fixturesDir = path.join(projectRootDir, 'test', 'fixtures')
const validSnapshot = path.join(fixturesDir, 'valid-snapshot.js')
const invalidSnapshot = path.join(fixturesDir, 'invalid-snapshot.js')
const outputDir = mkdirSync('test-mksnapshot')

describe('mksnapshot', () => {
  it('builds valid snapshot providing version 12.0.10', async () => {
    const providedVersion = '12.0.10'
    const args = [validSnapshot, '--output_dir', outputDir]
    const { version, snapshotBlobFile, v8ContextFile } = await syncAndRun(
      providedVersion,
      args,
    )

    expect(version).to.equal(providedVersion)
    expect(snapshotBlobFile).to.equal('snapshot_blob.bin')
    expect(v8ContextFile.startsWith('v8_context_snapshot')).to.be.true
  }).timeout(10000)

  it('builds invalid snapshot providing version 12.0.10', async () => {
    const providedVersion = '12.0.10'
    const args = [invalidSnapshot, '--output_dir', outputDir]

    try {
      await syncAndRun(providedVersion, args)
      assert.fail('should fail making invalid snapshot')
    } catch (err) {
      expect(err.message.includes('Failed to create snapshot blob'), 'fails with helpful error message').to.be.true
    }
  })

  it('builds valid snapshot providing version 14.0.0-beta.3', async () => {
    const providedVersion = '14.0.0-beta.3'
    const args = [validSnapshot, '--output_dir', outputDir]
    const { version, snapshotBlobFile, v8ContextFile } = await syncAndRun(
      providedVersion,
      args,
    )

    expect(version).to.equal(providedVersion)
    expect(snapshotBlobFile).to.equal('snapshot_blob.bin')
    expect(v8ContextFile.startsWith('v8_context_snapshot')).to.be.true
  }).timeout(10000)
})
