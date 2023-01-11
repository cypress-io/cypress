const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const fs = require('fs')

const { validateChangelogEntry, getIssueNumbers, _getResolvedMessage } = require('../../semantic-commits/validateChangelogEntry')

use(sinonChai)

describe('semantic-pull-request/validateChangelogEntry', () => {
  context('_getResolvedMessage', () => {
    it('returned pr link', () => {
      const message = _getResolvedMessage('feat', 52, [])

      expect(message).to.contain('Addressed in [#52](https://github.com/cypress-io/cypress/pull/52).')
    })

    it('returns linked issue', () => {
      const message = _getResolvedMessage('feat', 52, [39])

      expect(message).to.contain('Addresses [#39](https://github.com/cypress-io/cypress/issues/39).')
    })

    it('returns all linked issues', () => {
      let message = _getResolvedMessage('feat', 52, [39, 20])

      expect(message).to.contain('Addresses [#20](https://github.com/cypress-io/cypress/issues/20) and [#39](https://github.com/cypress-io/cypress/issues/39).')

      message = _getResolvedMessage('feat', 52, [39, 20, 30])

      expect(message).to.contain('Addresses [#20](https://github.com/cypress-io/cypress/issues/20), [#30](https://github.com/cypress-io/cypress/issues/30) and [#39](https://github.com/cypress-io/cypress/issues/39).')
    })
  })

  context('getIssueNumbers', () => {
    it('returns single issue link', () => {
      const issues = getIssueNumbers(`
        <!-- comment ->
        - Closes #23
        summary of changes see in #458
      `)

      expect(issues).to.deep.eq(['23'])
    })

    it('returns issue links for all linking keywords', () => {
      const issues = getIssueNumbers(`
        <!-- comment ->
        - Close #23
        - Closes #24
        - Closed #25
        - fix cypress-io/cypress#33, fixed cypress-io/cypress#34
        - fixes cypress-io/cypress#35
        - resolves #44
        - Resolved #45
        - Resolves #46
        - addresses #77 <-- not a valid linking word
        summary of changes
      `)

      expect(issues).to.deep.eq(['23', '24', '25', '33', '34', '35', '44', '45', '46'])
    })

    it('only counts an issue once', () => {
      const body = `
        - closes #44
        - closes #44
      `
      const issues = getIssueNumbers(body)

      expect(issues).to.deep.eq(['44'])
    })

    it('does not return non-local issue numbers', () => {
      const body = `
        fixes cypress-io/cypress#123 which is a local issue
        and this is issue in another repo foo/bar#101
      `
      const issues = getIssueNumbers(body)

      expect(issues).to.deep.eq(['123'])
    })

    it('returns empty list when no issues found', () => {
      const issues = getIssueNumbers(`
        <!-- comment ->
        summary of changes
      `)

      expect(issues).to.deep.eq([])
    })
  })

  context('validateChangelogEntry', () => {
    beforeEach(function () {
      sinon.spy(console, 'log')
      sinon.stub(fs, 'readFileSync')
    })

    afterEach(function () {
      // eslint-disable-next-line no-console
      console.log.restore()
      fs.readFileSync.restore()
    })

    it('verifies changelog entry has been included', async () => {
      const pullRequestFiles = [
        { filename: 'packages/driver/lib/index.js' },
        { filename: 'cli/CHANGELOG.md' },
      ]

      fs.readFileSync.returns('**Performance:**\n- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).')

      await validateChangelogEntry({
        prNumber: 77,
        pullRequestFiles,
        semanticResult: { type: 'perf' },
      })

      // eslint-disable-next-line no-console
      expect(console.log).to.be.calledWith('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
    })

    describe('ignores validation', () => {
      it('when commit does not include cli or binary file changes', async () => {
        const pullRequestFiles = [
          { filename: 'npm/grep/lib/index.js' },
        ]

        await validateChangelogEntry({
          prNumber: 77,
          pullRequestFiles,
          semanticResult: { type: 'feat' },
          body: ' - closes #75',
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain changes that impacts the next Cypress release.')
      })

      it('when commit does not include cli or binary file changes but had changelog change', async () => {
        const pullRequestFiles = [
          { filename: 'npm/grep/lib/index.js' },
          { filename: 'cli/CHANGELOG.md' },
        ]

        await validateChangelogEntry({
          prNumber: 77,
          pullRequestFiles,
          semanticResult: { type: 'feat' },
          body: ' - closes #75',
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain changes that impacts the next Cypress release.')
        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('Changelog entry is not required...')
      })

      it('when commit has cli or binary file changes that are not user facing', async () => {
        const pullRequestFiles = [
          { filename: 'packages/types/src/index.tsx' },
        ]

        await validateChangelogEntry({
          prNumber: 77,
          pullRequestFiles,
          semanticResult: { type: 'chore' },
          body: ' - closes #75',
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain user-facing changes that impacts the next Cypress release.')
      })

      it('when commit has cli or binary file changes that are not user facing and has changelog update', async () => {
        const pullRequestFiles = [
          { filename: 'packages/types/src/index.tsx' },
          { filename: 'cli/CHANGELOG.md' },
        ]

        await validateChangelogEntry({
          prNumber: 77,
          pullRequestFiles,
          semanticResult: { type: 'chore' },
          body: ' - closes #75',
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain user-facing changes that impacts the next Cypress release.')
        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('Changelog entry is not required...')
      })
    })

    it('throws an error when entry is missing', async () => {
      const pullRequestFiles = [
        { filename: 'packages/driver/lib/index.js' },
      ]

      return validateChangelogEntry({
        prNumber: 77,
        pullRequestFiles,
        semanticResult: { type: 'perf' },
        body: ' - closes #75',
      }).catch((err) => {
        expect(err.message).to.contain('A changelog entry was not found in cli/CHANGELOG.md')
      })
    })

    it('throws an error when entry does not correct change section', async () => {
      const pullRequestFiles = [
        { filename: 'packages/driver/lib/index.js' },
        { filename: 'cli/CHANGELOG.md' },
      ]

      fs.readFileSync.returns('**Features:**\n- Addresses [#39](https://github.com/cypress-io/cypress/issues/39).')

      return validateChangelogEntry({
        prNumber: 77,
        pullRequestFiles,
        semanticResult: { type: 'perf' },
        body: ' - closes #75',
      }).catch((err) => {
        expect(err.message).to.contain('The changelog does not include the **Performance:** section.')
      })
    })

    it('throws an error when entry does not include associated issue links', async () => {
      const pullRequestFiles = [
        { filename: 'packages/driver/lib/index.js' },
        { filename: 'cli/CHANGELOG.md' },
      ]

      fs.readFileSync.returns('**Performance:**')

      return validateChangelogEntry({
        prNumber: 77,
        pullRequestFiles,
        semanticResult: { type: 'perf' },
        body: ' - closes #75',
      }).catch((err) => {
        expect(err.message).to.contain('The changelog entry does not include the linked issues that this pull request resolves.')
      })
    })

    it('throws an error when entry does not include pull request link', async () => {
      const pullRequestFiles = [
        { filename: 'packages/driver/lib/index.js' },
        { filename: 'cli/CHANGELOG.md' },
      ]

      fs.readFileSync.returns('**Performance:**')

      return validateChangelogEntry({
        prNumber: 77,
        pullRequestFiles,
        semanticResult: { type: 'perf' },
      })
      .catch((err) => {
        expect(err.message).to.contain('The changelog entry does not include the pull request link.')
      })
    })
  })
})
