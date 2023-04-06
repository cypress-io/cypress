const { expect, use } = require('chai')
const la = require('lazy-ass')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

use(require('sinon-chai'))

const semanticReleasePullRequest = `
[semantic-release] › ℹ  Running semantic-release version 17.1.1
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/changelog"
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/git"
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/changelog"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/git"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "publish" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "addChannel" from "@semantic-release/npm"
[semantic-release] › ℹ  This run was triggered by a pull request and therefore a new version won't be published.
`

const semanticReleaseNoUpdate = (version) => {
  return `
[semantic-release] › ℹ  Running semantic-release version 17.1.1
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "publish" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "addChannel" from "@semantic-release/npm"
[semantic-release] › ⚠  Run automated release from branch develop on repository https://github.com/cypress-io/cypress.git in dry-run mode
[semantic-release] › ✔  Allowed to push to the Git repository
[semantic-release] › ℹ  Start step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] [@semantic-release/npm] › ℹ  Verify authentication for registry https://registry.npmjs.org/
[semantic-release] [@semantic-release/npm] › ℹ  Reading npm config from /cypress/npm/package/.npmrc
[semantic-release] › ✔  Completed step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] › ℹ  Found git tag @cypress/package-v${version} associated with version ${version} on branch develop
[semantic-release] › ℹ  Found 1 commits since last release
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Found 0 commits for package @cypress/package since last release
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Analysis of 0 commits complete: no release
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  There are no relevant changes, so no new version is released.
`
}

const semanticReleaseUpdate = (oldVersion, newVersion) => {
  return `
[semantic-release] › ℹ  Running semantic-release version 17.1.1
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "publish" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "addChannel" from "@semantic-release/npm"
[semantic-release] › ⚠  Run automated release from branch develop on repository https://github.com/cypress-io/cypress.git in dry-run mode
[semantic-release] › ✔  Allowed to push to the Git repository
[semantic-release] › ℹ  Start step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] [@semantic-release/npm] › ℹ  Verify authentication for registry https://registry.npmjs.org/
[semantic-release] [@semantic-release/npm] › ℹ  Reading npm config from /cypress/npm/package/.npmrc
[semantic-release] › ✔  Completed step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] › ℹ  Found git tag @cypress/package-v${oldVersion} associated with version ${oldVersion} on branch develop
[semantic-release] › ℹ  Found 2 commits since last release
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Found 1 commits for package @cypress/package since last release
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Analyzing commit: fix: bug
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  The release type for the commit is patch
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Analysis of 1 commits complete: patch release
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  The next release version is ${newVersion}
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Found 1 commits for package @cypress/package since last release
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ⚠  Skip step "prepare" of plugin "@semantic-release/npm" in dry-run mode
[semantic-release] › ⚠  Skip @cypress/package-v${newVersion} tag creation in dry-run mode
[semantic-release] › ⚠  Skip step "publish" of plugin "@semantic-release/npm" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ✔  Published release ${newVersion} on default channel
[semantic-release] › ℹ  Release note for version ${newVersion}:
# @cypress/package-v${newVersion} (https://github.com/cypress-io/cypress/compare/@cypress/package-v${oldVersion}...@cypress/package-v${newVersion}) (2020-01-01)

### Bug Fixes

    * bug (abcdef1 (https://github.com/cypress-io/cypress/commit/...))
`
}

const semanticReleaseNew = () => {
  return `
[semantic-release] › ℹ  Running semantic-release version 17.1.1
[semantic-release] › ✔  Loaded plugin "verifyConditions" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "prepare" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "publish" from "@semantic-release/npm"
[semantic-release] › ✔  Loaded plugin "addChannel" from "@semantic-release/npm"
[semantic-release] › ⚠  Run automated release from branch develop on repository https://github.com/cypress-io/cypress.git in dry-run mode
[semantic-release] › ✔  Allowed to push to the Git repository
[semantic-release] › ℹ  Start step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] [@semantic-release/npm] › ℹ  Verify authentication for registry https://registry.npmjs.org/
[semantic-release] [@semantic-release/npm] › ℹ  Reading npm config from /cypress/npm/package/.npmrc
[semantic-release] › ✔  Completed step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] › ℹ  No git tag version found on branch develop
[semantic-release] › ℹ  No previous release found, retrieving all commits
[semantic-release] › ℹ  Found 100 commits since last release
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Found 1 commits for package @cypress/package since last release
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Analyzing commit: feat: new
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  The release type for the commit is minor
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Analysis of 1 commits complete: minor release
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "analyzeCommits" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  There is no previous release, the next release version is 1.0.0
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] [[Function: semantic-release-monorepo]] › ℹ  Found 1 commits for package @cypress/package since last release
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ℹ  Start step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ✔  Completed step "generateNotes" of plugin "[Function: semantic-release-monorepo]"
[semantic-release] › ⚠  Skip step "prepare" of plugin "@semantic-release/npm" in dry-run mode
[semantic-release] › ⚠  Skip @cypress/package-v1.0.0 tag creation in dry-run mode
[semantic-release] › ⚠  Skip step "publish" of plugin "@semantic-release/npm" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ⚠  Skip step "success" of plugin "[Function: semantic-release-monorepo]" in dry-run mode
[semantic-release] › ✔  Published release 1.0.0 on default channel
[semantic-release] › ℹ  Release note for version 1.0.0:
# @cypress/package-v1.0.0 (2020-01-01)

### Features

    * new (abcdef1 (https://github.com/cypress-io/cypress/commit/...))
`
}

describe('semantic release', () => {
  let parseSemanticReleaseOutput
  let releasePackages
  let execaStub

  beforeEach(() => {
    sinon.restore()

    execaStub = sinon.stub()

    const npmRelease = proxyquire('../npm-release', {
      'execa': execaStub,
    })

    parseSemanticReleaseOutput = npmRelease.parseSemanticReleaseOutput
    releasePackages = npmRelease.releasePackages
  })

  context('#parseSemanticReleaseOutput', () => {
    it('ends with no output if triggered by a pull request', () => {
      const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleasePullRequest)

      la(currentVersion === undefined, 'Expected current version to be', undefined, 'but got', currentVersion, 'instead')
      la(nextVersion === undefined, 'Expected current version to be', undefined, 'but got', nextVersion, 'instead')
    })

    describe('parses old version number when there are no updates', () => {
      it('works with standard version number', () => {
        const version = '1.2.3'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

        la(currentVersion === version, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
        la(nextVersion === undefined, 'Expected next version to be', undefined, 'but got', nextVersion, 'instead')
      })

      it('works with version 0.x.x', () => {
        const version = '0.0.1'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

        la(currentVersion === version, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
        la(nextVersion === undefined, 'Expected next version to be', undefined, 'but got', nextVersion, 'instead')
      })

      it('works with postfix alpha/beta version', () => {
        const version = '0.1.2-alpha1.2'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

        la(currentVersion === version, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
        la(nextVersion === undefined, 'Expected next version to be', undefined, 'but got', nextVersion, 'instead')
      })

      it('does not work with non-semver version', () => {
        const version = 'abc'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

        la(currentVersion === undefined, 'Expected current version to be', undefined, 'but got', currentVersion, 'instead')
        la(nextVersion === undefined, 'Expected next version to be', undefined, 'but got', nextVersion, 'instead')
      })
    })

    describe('parses new version number when there are updates', () => {
      it('works with standard version numbers', () => {
        const oldVersion = '1.2.3'
        const newVersion = '1.2.4'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseUpdate(oldVersion, newVersion))

        la(currentVersion === oldVersion, 'Expected current version to be', oldVersion, 'but got', currentVersion, 'instead')
        la(nextVersion === newVersion, 'Expected next version to be', newVersion, 'but got', nextVersion, 'instead')
      })

      it('works with 0.x.x version numbers', () => {
        const oldVersion = '0.0.1'
        const newVersion = '0.1.0'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseUpdate(oldVersion, newVersion))

        la(currentVersion === oldVersion, 'Expected current version to be', oldVersion, 'but got', currentVersion, 'instead')
        la(nextVersion === newVersion, 'Expected next version to be', newVersion, 'but got', nextVersion, 'instead')
      })

      it('works with 0.x.x -> 1.0.0 version numbers', () => {
        const oldVersion = '0.2.4'
        const newVersion = '1.0.0'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseUpdate(oldVersion, newVersion))

        la(currentVersion === oldVersion, 'Expected current version to be', oldVersion, 'but got', currentVersion, 'instead')
        la(nextVersion === newVersion, 'Expected next version to be', newVersion, 'but got', nextVersion, 'instead')
      })

      it('works with postfix alpha/beta versions', () => {
        const oldVersion = '0.2.4-alpha'
        const newVersion = '0.3.0-beta'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseUpdate(oldVersion, newVersion))

        la(currentVersion === oldVersion, 'Expected current version to be', oldVersion, 'but got', currentVersion, 'instead')
        la(nextVersion === newVersion, 'Expected next version to be', newVersion, 'but got', nextVersion, 'instead')
      })

      it('works with postfix alpha/beta version -> 1.0.0', () => {
        const oldVersion = '0.2.4-alpha'
        const newVersion = '1.0.0'

        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseUpdate(oldVersion, newVersion))

        la(currentVersion === oldVersion, 'Expected current version to be', oldVersion, 'but got', currentVersion, 'instead')
        la(nextVersion === newVersion, 'Expected next version to be', newVersion, 'but got', nextVersion, 'instead')
      })
    })

    describe('parses new version number when there are no existing releases', () => {
      it('reports next version as 1.0.0', () => {
        const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNew())

        la(currentVersion === undefined, 'Expected current version to be', undefined, 'but got', currentVersion, 'instead')
        la(nextVersion === '1.0.0', 'Expected next version to be 1.0.0 but got', nextVersion, 'instead')
      })
    })
  })

  context('#releasePackages', () => {
    it('runs semantic release on each package', async () => {
      execaStub.returns({ stdout: 'the stdout' })
      await releasePackages(['package-1', 'package-2'])

      expect(execaStub).to.be.calledTwice
      expect(execaStub).to.be.calledWith(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
        { env: { NPM_CONFIG_WORKSPACES_UPDATE: false } },
      )
    })

    it('logs successfully released packages', async () => {
      sinon.spy(console, 'log')

      execaStub.returns({ stdout: 'the stdout' })
      await releasePackages(['package-1', 'package-2'])

      expect(console.log).to.be.calledWith('Released package-1 successfully:')
      expect(console.log).to.be.calledWith('Released package-2 successfully:')
      expect(console.log).to.be.calledWith('the stdout')
    })

    it('failures of one package release do not prevent subsequent package releases', async () => {
      execaStub.returns({ stdout: 'the stdout' })
      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-1' })

      await releasePackages(['package-1', 'package-2'])

      expect(execaStub).to.be.calledTwice
      expect(execaStub).to.be.calledWith(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
        { env: { NPM_CONFIG_WORKSPACES_UPDATE: false } },
      )
    })

    it('logs packages that failed to release', async () => {
      sinon.spy(console, 'log')

      execaStub.returns({ stdout: 'the stdout' })
      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-1' })

      await releasePackages(['package-1', 'package-2'])

      expect(console.log).to.be.calledWith('Releasing package-1 failed:')
      expect(console.log).to.be.calledWith('could not release package-1')
      expect(console.log).to.be.calledWith('Released package-2 successfully:')
      expect(console.log).to.be.calledWith('the stdout')
    })

    it('logs success when all release succeed', async () => {
      sinon.spy(console, 'log')

      execaStub.returns({ stdout: 'the stdout' })
      await releasePackages(['package-1', 'package-2'])

      expect(console.log).to.be.calledWith('\nAll packages released successfully')
    })

    it('logs failure when one or more releases fail', async () => {
      sinon.spy(console, 'log')

      execaStub.returns({ stdout: 'the stdout' })
      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-1' })

      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-3', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-3' })

      await releasePackages(['package-1', 'package-2', 'package-3'])

      expect(console.log).to.be.calledWith(`
The following packages failed to release:
- package-1
- package-3`)
    })

    it('returns 0 when all releases succeed', async () => {
      execaStub.returns({ stdout: 'the stdout' })
      const result = await releasePackages(['package-1', 'package-2'])

      expect(result).to.equal(0)
    })

    it('returns number of failures when one or more releases fail', async () => {
      execaStub.returns({ stdout: 'the stdout' })
      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-1', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-1' })

      execaStub.withArgs(
        'npx',
        ['lerna', 'exec', '--scope', 'package-3', '--', 'npx', '--no-install', 'semantic-release'],
      ).throws({ stack: 'could not release package-3' })

      const result = await releasePackages(['package-1', 'package-2', 'package-3'])

      expect(result).to.equal(2)
    })
  })
})
