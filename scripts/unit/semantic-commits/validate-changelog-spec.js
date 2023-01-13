/* eslint-disable no-console */
const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const fs = require('fs')

const { validateChangelog, _validateEntry, _getResolvedMessage } = require('../../semantic-commits/validate-changelog-entry')

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

  context('_validateEntry', () => {
    it('verifies changelog entry has been included', () => {
      const errors = _validateEntry(
        '**Performance:**\n- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).',
        {
          commitMessage: 'perf: fix an issue (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: [],
        },
      )

      expect(errors).to.have.length(0)
    })

    it('returns an error when entry does not correct change section', () => {
      const errors = _validateEntry(
        '**Bugfixes:**\n- Fixes [#75](https://github.com/cypress-io/cypress/issues/75).',
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: ['75'],
        },
      )

      expect(errors).to.have.length(1)
      expect(errors[0]).to.contain('The changelog does not include the **Performance:** section.')
    })

    it('returns an error when entry does not include associated issue links', () => {
      const errors = _validateEntry(
        '**Performance:**',
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: ['75'],
        },
      )

      expect(errors).to.have.length(1)
      expect(errors[0]).to.contain('The changelog entry does not include the linked issues that this pull request resolves.')
    })

    it('returns an error when entry does not include pull request link', () => {
      const errors = _validateEntry(
        '**Performance:**',
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
        },
      )

      expect(errors).to.have.length(1)
      expect(errors[0]).to.contain('The changelog entry does not include the pull request link.')
    })

    it('returns multiple error when entry does not correct section or include pull request link', () => {
      const errors = _validateEntry(
        '**Features:**\n-do something faster.',
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
        },
      )

      expect(errors).to.have.length(2)
      expect(errors[0]).to.contain('The changelog does not include the **Performance:** section.')
      expect(errors[1]).to.contain('The changelog entry does not include the pull request link.')
    })
  })

  context('validateChangelog', () => {
    beforeEach(function () {
      sinon.spy(console, 'log')
      sinon.stub(fs, 'readFileSync')
    })

    afterEach(function () {
      console.log.restore()
      fs.readFileSync.restore()
    })

    it('verifies changelog entry has been included', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns('**Performance:**\n- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).')

      await validateChangelog({
        changedFiles,
        commits: [{
          prNumber: 77,
          semanticType: 'perf',
        }],
      })

      expect(console.log).to.be.calledWith('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
    })

    describe('ignores validation', () => {
      it('when commit has cli or binary file changes that are not user facing', async () => {
        const changedFiles = [
          'packages/types/src/index.tsx',
        ]

        await validateChangelog({
          changedFiles,
          commits: [{
            prNumber: 77,
            semanticType: 'chore',
            associatedIssues: ['75'],
          }],
        })

        expect(console.log).to.be.calledWith('Does not contain any user-facing changes that impacts the next Cypress release.')
      })

      it('when commit does not include cli or binary file changes', async () => {
        const changedFiles = [
          'npm/grep/lib/index.js',
        ]

        await validateChangelog({
          changedFiles,
          commits: [{
            prNumber: 77,
            semanticType: 'feat',
            associatedIssues: ['75'],
          }],
        })

        expect(console.log).to.be.calledWith('Does not contain changes that impacts the next Cypress release.')
      })
    })

    describe('throws an error when', () => {
      it('entry is missing', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
        ]

        fs.readFileSync.returns('## 20.0.2')

        return validateChangelog({
          changedFiles,
          commits: [{
            commitMessage: 'feat: do something new (#77)',
            prNumber: 77,
            semanticType: 'feat',
            associatedIssues: ['75'],
          }],
        }).catch((err) => {
          expect(console.log).to.be.calledWith('A changelog entry was not found in cli/CHANGELOG.md.')
          expect(err.message).to.contain('There was one or more errors when validating the changelog. See above for details.')
        })
      })

      it('entry does not correct change section', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns('**Features:**\n- Addresses [#75](https://github.com/cypress-io/cypress/issues/75).')

        return validateChangelog({
          changedFiles,
          commits: [{
            commitMessage: 'perf: do something faster (#77)',
            prNumber: 77,
            semanticType: 'perf',
            associatedIssues: ['75'],
          }],
        }).catch((err) => {
          expect(err.message).to.contain('There was one or more errors when validating the changelog. See above for details.')
          expect(console.log.firstCall.args[0]).to.contain('The changelog does not include the **Performance:** section.')
        })
      })

      it('entry does not include associated issue links', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns('**Performance:**')

        return validateChangelog({
          changedFiles,
          commits: [{
            commitMessage: 'perf: do something faster (#77)',
            prNumber: 77,
            semanticType: 'perf',
            associatedIssues: ['75'],
          }],
        }).catch((err) => {
          expect(err.message).to.contain('There was one or more errors when validating the changelog. See above for details.')
          expect(console.log.firstCall.args[0]).to.contain('The changelog entry does not include the linked issues that this pull request resolves.')
        })
      })

      it('entry does not include pull request link', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns('**Performance:**')

        return validateChangelog({
          changedFiles,
          commits: [{
            commitMessage: 'perf: do something faster (#77)',
            prNumber: 77,
            semanticType: 'perf',
          }],
        })
        .catch((err) => {
          expect(err.message).to.contain('There was one or more errors when validating the changelog. See above for details.')
          expect(console.log.firstCall.args[0]).to.contain('The changelog entry does not include the pull request link.')
        })
      })
    })
  })
})
