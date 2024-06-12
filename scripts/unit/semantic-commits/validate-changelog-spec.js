const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const fs = require('fs')

const { validateChangelog, _validateEntry, _getResolvedMessage } = require('../../semantic-commits/validate-changelog')

use(sinonChai)

describe('semantic-pull-request/validate-changelog', () => {
  context('_getResolvedMessage', () => {
    it('returned pr link', () => {
      const { message, links } = _getResolvedMessage('feat', 52, [])

      expect(message).to.eq('Addressed in')
      expect(links).to.have.length(1)
      expect(links[0]).to.eq('[#52](https://github.com/cypress-io/cypress/pull/52)')
    })

    it('returns linked issue', () => {
      const { message, links } = _getResolvedMessage('feat', 52, [39])

      expect(message).to.eq('Addresses')
      expect(links).to.have.length(1)
      expect(links[0]).to.eq('[#39](https://github.com/cypress-io/cypress/issues/39)')
    })

    it('returns all linked issues', () => {
      let { message, links } = _getResolvedMessage('feat', 52, [39, 20])

      expect(message).to.eq('Addresses')
      expect(links).to.have.length(2)
      expect(links[0]).to.eq('[#20](https://github.com/cypress-io/cypress/issues/20)')
      expect(links[1]).to.eq('[#39](https://github.com/cypress-io/cypress/issues/39)')

      const resolveData = _getResolvedMessage('feat', 52, [39, 20, 30])

      expect(resolveData.message).to.eq('Addresses')
      expect(resolveData.links).to.have.length(3)
      expect(resolveData.links[0]).to.eq('[#20](https://github.com/cypress-io/cypress/issues/20)')
      expect(resolveData.links[1]).to.eq('[#30](https://github.com/cypress-io/cypress/issues/30)')
      expect(resolveData.links[2]).to.eq('[#39](https://github.com/cypress-io/cypress/issues/39)')
    })
  })

  context('_validateEntry', () => {
    it('verifies changelog entry has been included', () => {
      const errMessage = _validateEntry(
        { '**Performance:**': ['- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).'] },
        {
          commitMessage: 'perf: fix an issue (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: [],
        },
      )

      expect(errMessage).to.undefined
    })

    it('returns an error when entry does not correct change section', () => {
      const errMessage = _validateEntry(
        { '**Bugfixes:**': ['- Fixed in [#75](https://github.com/cypress-io/cypress/issues/75).'] },
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: ['75'],
        },
      )

      expect(errMessage).to.contain('The changelog does not include the **Performance:** section.')
    })

    it('returns an error when entry does not include associated issue links', () => {
      const errMessage = _validateEntry(
        { '**Performance:**': ['does another thing not related'] },
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
          associatedIssues: ['75'],
        },
      )

      expect(errMessage).to.contain('The changelog entry does not include the linked issues that this pull request resolves.')
    })

    it('returns an error when entry does not include pull request link', () => {
      const errMessage = _validateEntry(
        { '**Performance:**': ['does another thing not related'] },
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
        },
      )

      expect(errMessage).to.contain('The changelog entry does not include the pull request link.')
    })

    it('returns multiple error when entry does not correct section or include pull request link', () => {
      const errMessage = _validateEntry(
        { '**Features:**': ['does another cool'] },
        {
          commitMessage: 'perf: do something faster (#77)',
          semanticType: 'perf',
          prNumber: 77,
        },
      )

      expect(errMessage).to.contain('The changelog does not include the **Performance:** section.')
    })
  })

  context('validateChangelog', () => {
    let circleBranch

    beforeEach(function () {
      sinon.spy(console, 'log')
      sinon.stub(fs, 'readFileSync')

      circleBranch = process.env.CIRCLE_BRANCH
      // delete this in case it's set in actual Circle env vars
      delete process.env.SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES
    })

    afterEach(function () {
      console.log.restore()
      fs.readFileSync.restore()

      process.env.CIRCLE_BRANCH = circleBranch
      // clean up after the test that sets and tests it
      delete process.env.SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES
    })

    it('verifies changelog entry has been included', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Performance:**

- Fixed in [#77](https://github.com/cypress-io/cypress/pull/77).`)

      await validateChangelog({
        changedFiles,
        commits: [{
          prNumber: 77,
          semanticType: 'perf',
        }],
      })

      expect(console.log).to.be.calledWith('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
    })

    it('verifies changelog with shared entry', async () => {
      const changedFiles = [
        'packages/driver/lib/index.js',
        'cli/CHANGELOG.md',
      ]

      fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Misc:**

- Addresses [#77](https://github.com/cypress-io/cypress/issues/77) and [#88](https://github.com/cypress-io/cypress/issues/88).`)

      await validateChangelog({
        changedFiles,
        commits: [{
          prNumber: 74,
          semanticType: 'misc',
          associatedIssues: ['77'],
        }, {
          prNumber: 75,
          semanticType: 'misc',
          associatedIssues: ['88'],
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

      it('when current branch is in SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES env var', async () => {
        process.env.CIRCLE_BRANCH = 'this-branch'
        process.env.SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES = 'this-branch,that-branch'

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

        expect(console.log).to.be.calledWith('Skipping changelog validation because branch (this-branch) is included in SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES')
      })
    })

    describe('throws an error when', () => {
      it('entry is missing', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
        ]

        fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

`)

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

      it('entry does not include correct change section', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Features:**

- Addresses [#75](https://github.com/cypress-io/cypress/issues/75).`)

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

      it('entry added to wrong change section', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Performance:**

- Some other update already added & vetted. Addresses [#32](https://github.com/cypress-io/cypress/issues/32).

**Features:**

- Fixes [#75](https://github.com/cypress-io/cypress/issues/75).`)

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
          expect(console.log.firstCall.args[0]).to.contain('Found the changelog entry in the wrong section.')
        })
      })

      it('entry does not include associated issue links', async () => {
        const changedFiles = [
          'packages/driver/lib/index.js',
          'cli/CHANGELOG.md',
        ]

        fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Performance:**

- comment without link.`)

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

        fs.readFileSync.returns(`
## 120.2.0

_Released 01/17/2033 (PENDING)_

**Performance:**

- comment without link.`)

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
