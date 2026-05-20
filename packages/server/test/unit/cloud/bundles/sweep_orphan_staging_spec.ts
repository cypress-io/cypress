import '../../../spec_helper'
import { ensureDir, mkdtemp, pathExists, remove, utimes, writeFile } from 'fs-extra'
import os from 'os'
import path from 'path'
import { sweepOrphanStaging } from '../../../../lib/cloud/bundles/sweep_orphan_staging'

const ageOf = (ms: number) => (Date.now() - ms) / 1000

describe('sweepOrphanStaging', () => {
  let baseDir: string

  beforeEach(async () => {
    baseDir = await mkdtemp(path.join(os.tmpdir(), 'cy-sweep-'))
  })

  afterEach(async () => {
    await remove(baseDir).catch(() => { /* ignore */ })
  })

  it('removes staging dirs older than the threshold', async () => {
    const stale = path.join(baseDir, '.staging-stale')

    await ensureDir(stale)
    await writeFile(path.join(stale, 'a'), 'x')

    const oldSeconds = ageOf(2 * 60 * 60 * 1000) // 2h ago

    await utimes(stale, oldSeconds, oldSeconds)

    const removed = await sweepOrphanStaging(baseDir, 60 * 60 * 1000)

    expect(removed).to.equal(1)
    expect(await pathExists(stale)).to.equal(false)
  })

  it('leaves staging dirs younger than the threshold alone', async () => {
    const fresh = path.join(baseDir, '.staging-fresh')

    await ensureDir(fresh)
    await writeFile(path.join(fresh, 'a'), 'x')

    const removed = await sweepOrphanStaging(baseDir, 60 * 60 * 1000)

    expect(removed).to.equal(0)
    expect(await pathExists(fresh)).to.equal(true)
  })

  it('ignores non-staging entries even when old', async () => {
    const final = path.join(baseDir, 'somehash')

    await ensureDir(final)
    const oldSeconds = ageOf(2 * 60 * 60 * 1000)

    await utimes(final, oldSeconds, oldSeconds)

    const removed = await sweepOrphanStaging(baseDir, 60 * 60 * 1000)

    expect(removed).to.equal(0)
    expect(await pathExists(final)).to.equal(true)
  })

  it('returns 0 and swallows errors when baseDir does not exist', async () => {
    const removed = await sweepOrphanStaging(path.join(baseDir, 'does-not-exist'), 60 * 60 * 1000)

    expect(removed).to.equal(0)
  })
})
