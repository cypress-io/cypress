const { expect, use } = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

use(require('sinon-chai'))

describe('get-next-version', () => {
  const releasedVersion = '12.2.0'
  let getNextVersionForPath
  let getNextVersionForBinary
  let bumpStub
  let getCurrentReleaseDataStub

  afterEach(() => {
    delete process.env.NEXT_VERSION
  })

  beforeEach(() => {
    sinon.restore()

    bumpStub = sinon.stub()
    getCurrentReleaseDataStub = sinon.stub()
    getCurrentReleaseDataStub.resolves({
      version: releasedVersion,
    })

    const npmRelease = proxyquire('../get-next-version', {
      'conventional-recommended-bump': bumpStub,
      './semantic-commits/get-current-release-data': {
        getCurrentReleaseData: getCurrentReleaseDataStub,
      },
      '../package.json': sinon.stub({ version: releasedVersion }),
    })

    getNextVersionForPath = npmRelease.getNextVersionForPath
    getNextVersionForBinary = npmRelease.getNextVersionForBinary
  })

  context('#getNextVersionForPath', () => {
    it('determines next version is patch', async () => {
      const semanticCommits = [
        { type: 'fix' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        const { level } = whatBump(semanticCommits)

        expect(level, 'semantic bump level').to.eq(2)

        return cb(undefined, { releaseType: 'patch' })
      })

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).to.eq('12.2.1')
      expect(commits).to.contain.members(semanticCommits)
    })

    it('determines next version is minor', async () => {
      const semanticCommits = [
        { type: 'fix' },
        { type: 'feat' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        const { level } = whatBump(semanticCommits)

        expect(level, 'semantic bump level').to.eq(1)

        return cb(undefined, { releaseType: 'minor' })
      })

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).to.eq('12.3.0')
      expect(commits).to.contain.members(semanticCommits)
    })

    it('determines next version is major', async () => {
      const semanticCommits = [
        { type: 'fix' },
        { type: 'feat' },
        { type: 'breaking' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        const { level } = whatBump(semanticCommits)

        expect(level, 'semantic bump level').to.eq(0)

        return cb(undefined, { releaseType: 'major' })
      })

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).to.eq('13.0.0')
      expect(commits).to.contain.members(semanticCommits)
    })

    it('honors package.json version when its been bumped', async () => {
      const semanticCommits = [
        { type: 'fix' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        const { level } = whatBump(semanticCommits)

        expect(level, 'semantic bump level').to.eq(2)

        return cb(undefined, { releaseType: 'patch' })
      })

      getCurrentReleaseDataStub.resolves({
        // package version !== release version assumed check in version is correct
        version: '12.2.2',
      })

      const { nextVersion, commits } = await getNextVersionForPath('packages')

      expect(nextVersion).to.eq('12.2.0')
      expect(commits).to.contain.members(semanticCommits)
    })

    it('honors NEXT_VERSION env', async () => {
      process.env.NEXT_VERSION = '15.0.0'
      const semanticCommits = [
        { type: 'fix' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        const { level } = whatBump(semanticCommits)

        expect(level, 'semantic bump level').to.eq(2)

        return cb(undefined, { releaseType: 'patch' })
      })

      const { nextVersion, commits } = await getNextVersionForPath('packages', '12.2.2')

      expect(nextVersion).to.eq('15.0.0')
      expect(commits).to.contain.members(semanticCommits)
    })
  })

  context('#getNextVersionForBinary', () => {
    it('determines next version for all cli & packages changes', async () => {
      let calls = 0
      const cliSemanticCommits = [
        { type: 'fix', title: 'fix: cli' },
        { type: 'fix', title: 'fix: typescript' },
        { type: 'dependency', title: 'dependency: security update' },
      ]

      const packagesSemanticCommits = [
        { type: 'feat', title: 'feat: add new command' },
      ]

      bumpStub.callsFake(async ({ whatBump, _path }, cb) => {
        if (calls === 0) {
          const { level } = whatBump(packagesSemanticCommits)

          expect(level, 'semantic bump level').to.eq(1)
          calls++

          return cb(undefined, { releaseType: 'minor' })
        }

        const { level } = whatBump(cliSemanticCommits)

        expect(level, 'semantic bump level').to.eq(2)

        return cb(undefined, { releaseType: 'patch' })
      })

      const { nextVersion, commits } = await getNextVersionForBinary('packages', releasedVersion)

      expect(nextVersion).to.eq('12.3.0')

      expect(commits).to.contain.members(packagesSemanticCommits)
      expect(commits).to.contain.members(cliSemanticCommits)
    })
  })
})
