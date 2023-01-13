const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const fs = require('fs')

const { validateChangelogEntry, _getResolvedMessage } = require('../../semantic-commits/validate-changelog-entry')

use(sinonChai)

describe('semantic-pull-request/validate-changelog-entry', () => {
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
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns('**Performance:**\n- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).')

      await validateChangelogEntry({
        prNumber: 77,
        changedFiles,
        semanticType: 'perf',
      })

      // eslint-disable-next-line no-console
      expect(console.log).to.be.calledWith('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
    })

    describe('ignores validation', () => {
      it('when commit does not include cli or binary file changes', async () => {
        const changedFiles = [
          'npm/grep/lib/index.js',
        ]

        await validateChangelogEntry({
          prNumber: 77,
          changedFiles,
          semanticResult: { type: 'feat' },
          associatedIssues: ['75'],
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain changes that impacts the next Cypress release.')
      })

      it('when commit does not include cli or binary file changes but had changelog change', async () => {
        const changedFiles = [
          'npm/grep/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        await validateChangelogEntry({
          prNumber: 77,
          changedFiles,
          semanticResult: { type: 'feat' },
          associatedIssues: ['75'],
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain changes that impacts the next Cypress release.')
        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('Changelog entry is not required...')
      })

      it('when commit has cli or binary file changes that are not user facing', async () => {
        const changedFiles = [
          'packages/types/src/index.tsx',
        ]

        await validateChangelogEntry({
          prNumber: 77,
          changedFiles,
          semanticResult: { type: 'chore' },
          associatedIssues: ['75'],
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain user-facing changes that impacts the next Cypress release.')
      })

      it('when commit has cli or binary file changes that are not user facing and has changelog update', async () => {
        const changedFiles = [
          'packages/types/src/index.tsx',
          'cli/CHANGELOG.md',
        ]

        await validateChangelogEntry({
          prNumber: 77,
          changedFiles,
          semanticResult: { type: 'chore' },
          associatedIssues: ['75'],
        })

        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('This pull request does not contain user-facing changes that impacts the next Cypress release.')
        // eslint-disable-next-line no-console
        expect(console.log).to.be.calledWith('Changelog entry is not required...')
      })
    })

    it('throws an error when entry is missing', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
      ]

      return validateChangelogEntry({
        prNumber: 77,
        changedFiles,
        semanticType: 'perf',
        associatedIssues: ['75'],
      }).catch((err) => {
        expect(err.message).to.contain('A changelog entry was not found in cli/CHANGELOG.md')
      })
    })

    it('throws an error when entry does not correct change section', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns('**Features:**\n- Addresses [#39](https://github.com/cypress-io/cypress/issues/39).')

      return validateChangelogEntry({
        prNumber: 77,
        changedFiles,
        semanticType: 'perf',
        associatedIssues: ['75'],
      }).catch((err) => {
        expect(err.message).to.contain('The changelog does not include the **Performance:** section.')
      })
    })

    it('throws an error when entry does not include associated issue links', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns('**Performance:**')

      return validateChangelogEntry({
        prNumber: 77,
        changedFiles,
        semanticType: 'perf',
        associatedIssues: ['75'],
      }).catch((err) => {
        expect(err.message).to.contain('The changelog entry does not include the linked issues that this pull request resolves.')
      })
    })

    it('throws an error when entry does not include pull request link', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns('**Performance:**')

      return validateChangelogEntry({
        prNumber: 77,
        changedFiles,
        semanticType: 'perf',
      })
      .catch((err) => {
        expect(err.message).to.contain('The changelog entry does not include the pull request link.')
      })
    })
  })
})
