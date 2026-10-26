const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const childProcess = require('child_process')

const { getChangelogDiff, getAddedEntries, validateChangelogPlacement } = require('../../semantic-commits/validate-changelog-placement')

use(sinonChai)

const changelogContent = [
  '<!-- See ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->',
  '## 16.2.1',
  '',
  '**Bugfixes:**',
  '',
  '- Existing unreleased fix. Fixed in [#1](https://github.com/cypress-io/cypress/pull/1).',
  '- New unreleased fix. Fixed in [#2](https://github.com/cypress-io/cypress/pull/2).',
  '',
  '## 16.2.0',
  '',
  '**Bugfixes:**',
  '',
  '- Existing released fix. Fixed in [#3](https://github.com/cypress-io/cypress/pull/3).',
  '- New released fix. Fixed in [#4](https://github.com/cypress-io/cypress/pull/4).',
  '',
].join('\n')

const diffOf = (...hunks) => {
  return [
    'diff --git a/cli/CHANGELOG.md b/cli/CHANGELOG.md',
    'index 1111111..2222222 100644',
    '--- a/cli/CHANGELOG.md',
    '+++ b/cli/CHANGELOG.md',
    ...hunks,
  ].join('\n')
}

const unreleasedHunk = '@@ -6,0 +7 @@ **Bugfixes:**\n+- New unreleased fix. Fixed in [#2](https://github.com/cypress-io/cypress/pull/2).'
const releasedHunk = '@@ -12,0 +14 @@ **Bugfixes:**\n+- New released fix. Fixed in [#4](https://github.com/cypress-io/cypress/pull/4).'

describe('semantic-commits/validate-changelog-placement', () => {
  context('getAddedEntries', () => {
    it('returns each added entry with its line number in the new file', () => {
      expect(getAddedEntries(diffOf(unreleasedHunk, releasedHunk))).to.deep.eq([
        { lineNumber: 7, text: '- New unreleased fix. Fixed in [#2](https://github.com/cypress-io/cypress/pull/2).' },
        { lineNumber: 14, text: '- New released fix. Fixed in [#4](https://github.com/cypress-io/cypress/pull/4).' },
      ])
    })

    it('counts every added line, not only entries, when tracking line numbers', () => {
      const diff = diffOf('@@ -1,0 +2,4 @@\n+## 16.2.2\n+\n+**Bugfixes:**\n+\n+- Moved fix.')

      expect(getAddedEntries(diff)).to.deep.eq([{ lineNumber: 6, text: '- Moved fix.' }])
    })

    it('skips hunks that edit existing lines', () => {
      const diff = diffOf('@@ -13 +13 @@ **Bugfixes:**\n-- Existing relased fix.\n+- Existing released fix.')

      expect(getAddedEntries(diff)).to.deep.eq([])
    })
  })

  context('validateChangelogPlacement', () => {
    it('passes when the pull request does not change the changelog', () => {
      const errors = validateChangelogPlacement({ diff: '', changelogContent, releasedVersions: ['16.2.0'] })

      expect(errors).to.deep.eq([])
    })

    it('passes an entry added under the unreleased version', () => {
      const errors = validateChangelogPlacement({ diff: diffOf(unreleasedHunk), changelogContent, releasedVersions: ['16.1.0', '16.2.0'] })

      expect(errors).to.deep.eq([])
    })

    it('fails an entry added under a released version and names the unreleased version to move it to', () => {
      const errors = validateChangelogPlacement({ diff: diffOf(unreleasedHunk, releasedHunk), changelogContent, releasedVersions: ['16.1.0', '16.2.0'] })

      expect(errors).to.deep.eq([
        'The changelog entry on line 14 of cli/CHANGELOG.md was added under 16.2.0, which has already been released:\n\n' +
        '  - New released fix. Fixed in [#4](https://github.com/cypress-io/cypress/pull/4).\n\n' +
        'Move it under **Bugfixes:** in 16.2.1, the next unreleased version.',
      ])
    })

    it('asks for a new release section when every version in the changelog is released', () => {
      const errors = validateChangelogPlacement({ diff: diffOf(unreleasedHunk), changelogContent, releasedVersions: ['16.2.0', '16.2.1'] })

      expect(errors).to.have.length(1)
      expect(errors[0]).to.include('was added under 16.2.1, which has already been released')
      expect(errors[0]).to.include('Move it under **Bugfixes:** in a new "## <next version>" release added above "## 16.2.1". Merge the latest develop first, since it may already have one.')
    })

    it('passes an edit to an entry under a released version', () => {
      const diff = diffOf('@@ -13 +13 @@ **Bugfixes:**\n-- Existing relased fix.\n+- Existing released fix. Fixed in [#3](https://github.com/cypress-io/cypress/pull/3).')

      expect(validateChangelogPlacement({ diff, changelogContent, releasedVersions: ['16.2.0'] })).to.deep.eq([])
    })

    it('truncates long entries in the error', () => {
      const longEntry = `- ${'a'.repeat(200)}`
      const content = `## 16.2.0\n\n**Bugfixes:**\n\n${longEntry}\n`
      const [error] = validateChangelogPlacement({ diff: diffOf(`@@ -4,0 +5 @@\n+${longEntry}`), changelogContent: content, releasedVersions: ['16.2.0'] })

      expect(error).to.include(`  ${longEntry.slice(0, 119)}…\n`)
    })
  })

  context('getChangelogDiff', () => {
    let execSync

    beforeEach(() => {
      execSync = sinon.stub(childProcess, 'execSync')
      execSync.withArgs('git merge-base origin/develop HEAD').returns('abc123\n')
      execSync.withArgs('git diff --unified=0 abc123 -- cli/CHANGELOG.md').returns('the diff\n')
    })

    afterEach(() => {
      sinon.restore()
    })

    it('diffs the changelog against the merge base with develop', () => {
      execSync.withArgs('git rev-parse --verify --quiet origin/develop').returns('abc123\n')

      expect(getChangelogDiff()).to.eq('the diff')
      expect(execSync).not.to.have.been.calledWith(sinon.match(/^git fetch/))
    })

    it('fetches the base branch when it is not available locally', () => {
      execSync.withArgs('git rev-parse --verify --quiet origin/develop').throws(new Error('not found'))
      execSync.withArgs('git fetch --no-tags origin develop:refs/remotes/origin/develop').returns('')

      expect(getChangelogDiff()).to.eq('the diff')
      expect(execSync).to.have.been.calledWith('git fetch --no-tags origin develop:refs/remotes/origin/develop')
    })
  })
})
