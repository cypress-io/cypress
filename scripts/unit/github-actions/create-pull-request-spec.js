const { expect } = require('chai')
const {
  createPullRequest,
} = require('../../github-actions/create-pull-request')
const sinon = require('sinon')

describe('pull requests', () => {
  context('.createPullRequest', () => {
    it('creates pull request with correct properties', async () => {
      const github = {
        rest: {
          pulls: {
            create: sinon.stub().returns(Promise.resolve({ data: { number: 123 } })),
          },
        },
      }

      const context = {
        repo: {
          owner: 'cypress-io',
          repo: 'cypress',
        },
      }

      await createPullRequest({
        context,
        github,
        baseBranch: 'develop',
        branchName: 'some-branch-name',
        description: 'Update Chrome',
        body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
      })

      expect(github.rest.pulls.create).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        base: 'develop',
        head: 'some-branch-name',
        title: 'chore: Update Chrome',
        body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
        maintainer_can_modify: true,
      })
    })

    it('creates pull request with correct properties including reviewers', async () => {
      const github = {
        rest: {
          pulls: {
            create: sinon.stub().returns(Promise.resolve({ data: { number: 123 } })),
            requestReviewers: sinon.stub().returns(Promise.resolve()),
          },
        },
      }

      const context = {
        repo: {
          owner: 'cypress-io',
          repo: 'cypress',
        },
      }

      await createPullRequest({
        context,
        github,
        baseBranch: 'develop',
        branchName: 'some-branch-name',
        description: 'Update Chrome',
        body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
        reviewers: ['ryanthemanuel'],
      })

      expect(github.rest.pulls.create).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        base: 'develop',
        head: 'some-branch-name',
        title: 'chore: Update Chrome',
        body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
        maintainer_can_modify: true,
      })

      expect(github.rest.pulls.requestReviewers).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        pull_number: 123,
        reviewers: ['ryanthemanuel'],
      })
    })
  })
})
