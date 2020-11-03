const la = require('lazy-ass')

const { parseSemanticReleaseOutput } = require('../npm-release')

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
[semantic-release] › ⚠  Run automated release from branch cleanup-init-monorepo on repository https://github.com/cypress-io/cypress.git in dry-run mode
[semantic-release] › ✔  Allowed to push to the Git repository
[semantic-release] › ℹ  Start step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] [@semantic-release/npm] › ℹ  Verify authentication for registry http://registry.npmjs.org/
[semantic-release] [@semantic-release/npm] › ℹ  Reading npm config from /cypress/npm/package/.npmrc
[semantic-release] › ✔  Completed step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] › ℹ  Found git tag @cypress/package-v${version} associated with version ${version} on branch master
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
[semantic-release] › ⚠  Run automated release from branch cleanup-init-monorepo on repository https://github.com/cypress-io/cypress.git in dry-run mode
[semantic-release] › ✔  Allowed to push to the Git repository
[semantic-release] › ℹ  Start step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] [@semantic-release/npm] › ℹ  Verify authentication for registry http://registry.npmjs.org/
[semantic-release] [@semantic-release/npm] › ℹ  Reading npm config from /cypress/npm/package/.npmrc
[semantic-release] › ✔  Completed step "verifyConditions" of plugin "@semantic-release/npm"
[semantic-release] › ℹ  Found git tag @cypress/package-v${oldVersion} associated with version ${oldVersion} on branch cleanup-init-monorepo
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

describe('semantic release', () => {
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
      la(nextVersion === undefined, 'Expected next version to be', version, 'but got', nextVersion, 'instead')
    })

    it('works with version 0.x.x', () => {
      const version = '0.0.1'

      const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

      la(currentVersion === version, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
      la(nextVersion === undefined, 'Expected next version to be', version, 'but got', nextVersion, 'instead')
    })

    it('works with postfix alpha/beta version', () => {
      const version = '0.1.2-alpha1.2'

      const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

      la(currentVersion === version, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
      la(nextVersion === undefined, 'Expected next version to be', version, 'but got', nextVersion, 'instead')
    })

    it('does not work with non-semver version', () => {
      const version = 'abc'

      const { currentVersion, nextVersion } = parseSemanticReleaseOutput(semanticReleaseNoUpdate(version))

      la(currentVersion === undefined, 'Expected current version to be', version, 'but got', currentVersion, 'instead')
      la(nextVersion === undefined, 'Expected next version to be', version, 'but got', nextVersion, 'instead')
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
})
