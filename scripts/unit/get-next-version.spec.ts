import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getNextVersionForBinary, getNextVersionForPath } from '../get-next-version.mts'

const releasedVersion = '12.2.0'

const { bumpStub, getCurrentReleaseDataStub } = vi.hoisted(() => {
  return {
    bumpStub: vi.fn(),
    getCurrentReleaseDataStub: vi.fn(),
  }
})

vi.mock('conventional-recommended-bump', () => {
  return { default: bumpStub }
})

vi.mock('../semantic-commits/get-current-release-data.js', () => {
  return { getCurrentReleaseData: getCurrentReleaseDataStub }
})

vi.mock('../../package.json', () => {
  return { default: { version: '12.2.0' } }
})

type Commit = { type: string, title?: string }
type BumpCallback = (err: Error | undefined, result: { releaseType: string }) => void
type WhatBump = (commits: Commit[]) => { level: number }

const bumpTo = (releaseType: string, semanticCommits: Commit[], expectedLevel: number) => {
  bumpStub.mockImplementation(({ whatBump }: { whatBump: WhatBump }, cb: BumpCallback) => {
    expect(whatBump(semanticCommits).level, 'semantic bump level').toBe(expectedLevel)

    cb(undefined, { releaseType })
  })
}

describe('get-next-version', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getCurrentReleaseDataStub.mockResolvedValue({ version: releasedVersion })
  })

  afterEach(() => {
    delete process.env.NEXT_VERSION
  })

  describe('#getNextVersionForPath', () => {
    it('determines next version is patch', async () => {
      const semanticCommits = [{ type: 'fix' }]

      bumpTo('patch', semanticCommits, 2)

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('12.2.1')
      expect(commits).toEqual(expect.arrayContaining(semanticCommits))
    })

    it('determines next version is minor', async () => {
      const semanticCommits = [{ type: 'fix' }, { type: 'feat' }]

      bumpTo('minor', semanticCommits, 1)

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('12.3.0')
      expect(commits).toEqual(expect.arrayContaining(semanticCommits))
    })

    it('determines next version is major', async () => {
      const semanticCommits = [{ type: 'fix' }, { type: 'feat' }, { type: 'breaking' }]

      bumpTo('major', semanticCommits, 0)

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('13.0.0')
      expect(commits).toEqual(expect.arrayContaining(semanticCommits))
    })

    it('honors package.json version when its been bumped', async () => {
      const semanticCommits = [{ type: 'fix' }]

      bumpTo('patch', semanticCommits, 2)

      // package version !== release version assumed check in version is correct
      getCurrentReleaseDataStub.mockResolvedValue({ version: '12.2.2' })

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('12.2.0')
      expect(commits).toEqual(expect.arrayContaining(semanticCommits))
    })

    it('honors NEXT_VERSION env', async () => {
      process.env.NEXT_VERSION = '15.0.0'
      const semanticCommits = [{ type: 'fix' }]

      bumpTo('patch', semanticCommits, 2)

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('15.0.0')
      expect(commits).toEqual(expect.arrayContaining(semanticCommits))
    })
  })

  describe('on a previous-major branch', () => {
    beforeEach(() => {
      getCurrentReleaseDataStub.mockResolvedValue({ version: releasedVersion, isPreviousMajor: true })
    })

    it('allows a patch bump', async () => {
      bumpTo('patch', [], 2)

      const { nextVersion } = await getNextVersionForPath('packages')

      expect(nextVersion).toBe('12.2.1')
    })

    it('throws on a major bump', async () => {
      bumpTo('major', [], 2)

      await expect(getNextVersionForPath('packages')).rejects.toThrow('The next version 13.0.0 is outside the 12.x line this branch releases.')
    })

    it('throws when NEXT_VERSION is in a newer major', async () => {
      process.env.NEXT_VERSION = '13.0.1'
      bumpTo('patch', [], 2)

      await expect(getNextVersionForPath('packages')).rejects.toThrow('The next version 13.0.1 is outside the 12.x line this branch releases.')
    })
  })

  describe('#getNextVersionForBinary', () => {
    it('determines next version for all cli & packages changes', async () => {
      const packagesSemanticCommits = [
        { type: 'feat', title: 'feat: add new command' },
      ]

      const cliSemanticCommits = [
        { type: 'fix', title: 'fix: cli' },
        { type: 'fix', title: 'fix: typescript' },
        { type: 'dependency', title: 'dependency: security update' },
      ]

      bumpStub
      .mockImplementationOnce(({ whatBump }: { whatBump: WhatBump }, cb: BumpCallback) => {
        expect(whatBump(packagesSemanticCommits).level, 'semantic bump level').toBe(1)
        cb(undefined, { releaseType: 'minor' })
      })
      .mockImplementationOnce(({ whatBump }: { whatBump: WhatBump }, cb: BumpCallback) => {
        expect(whatBump(cliSemanticCommits).level, 'semantic bump level').toBe(2)
        cb(undefined, { releaseType: 'patch' })
      })

      const { nextVersion, commits } = await getNextVersionForBinary()

      expect(nextVersion).toBe('12.3.0')
      expect(commits).toEqual(expect.arrayContaining(packagesSemanticCommits))
      expect(commits).toEqual(expect.arrayContaining(cliSemanticCommits))
    })
  })
})
