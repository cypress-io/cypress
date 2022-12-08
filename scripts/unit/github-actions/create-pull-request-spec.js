const {
  createPullRequest,
} = require('../../github-actions/create-pull-request')
const sinon = require('sinon')

describe('pull requests', () => {
  context('.createPullRequest', () => {
    it('creates pull request with correct properties', async () => {
      const github = {
        pulls: {
          create: sinon.stub().returns(Promise.resolve()),
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

      expect(github.pulls.create).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        base: 'develop',
        head: 'some-branch-name',
        title: 'chore: Update Chrome',
        body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
        maintainer_can_modify: true,
      })
    })
  })
})
