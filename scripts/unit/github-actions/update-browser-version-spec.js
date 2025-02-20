const chai = require('chai')
const fs = require('fs')
const mockfs = require('mock-fs')
const nock = require('nock')
const sinon = require('sinon')

chai.use(require('sinon-chai'))

const { expect } = chai

const {
  getVersions,
  checkNeedForBranchUpdate,
  updateBrowserVersionsFile,
  updatePRTitle,
} = require('../../github-actions/update-browser-versions')

const coreStub = () => {
  return {
    setOutput: sinon.stub(),
  }
}

const stubChromeVersionResult = (channel, result) => {
  nock('https://versionhistory.googleapis.com')
  .get((uri) => uri.includes(channel))
  .reply(200, result)
}

const stubRepoVersions = ({ betaVersion, stableVersion }) => {
  mockfs({
    './.circleci/workflows.yml': `chrome-stable-version: &chrome-stable-version "${stableVersion}"\nchrome-beta-version: &chrome-beta-version "${betaVersion}"\n`,
  })
}

const stubChromeVersions = ({ betaVersion, stableVersion }) => {
  stubChromeVersionResult('stable',
    {
      versions: stableVersion ? [
        {
          name: `chrome/platforms/linux/channels/stable/versions/${stableVersion}`,
          version: stableVersion,
        },
      ] : [],
      nextPageToken: '',
    })

  stubChromeVersionResult('beta',
    {
      versions: betaVersion ? [
        {
          name: `chrome/platforms/linux/channels/beta/versions/${betaVersion}`,
          version: betaVersion,
        },
      ] : [],
      nextPageToken: '',
    })
}

describe('update browser version github action', () => {
  beforeEach(() => {
    sinon.restore()
    mockfs.restore()
    nock.cleanAll()
  })

  context('.getVersions', () => {
    beforeEach(() => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
      })
    })

    it('sets has_update: true when there is a stable update', async () => {
      stubChromeVersions({
        stableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a beta update', async () => {
      stubChromeVersions({
        betaVersion: '1.2',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a stable update and a beta update', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: false when there is not a stable update or a beta update', async () => {
      stubChromeVersions({})

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'false')
    })

    it('sets has_update: false if there is a failure', async () => {
      stubChromeVersions({})

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'false')
    })

    it('sets versions', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('current_stable_version', '1.0')
      expect(core.setOutput).to.be.calledWith('latest_stable_version', '2.0')
      expect(core.setOutput).to.be.calledWith('current_beta_version', '1.1')
      expect(core.setOutput).to.be.calledWith('latest_beta_version', '2.1')
    })

    it('sets description correctly when there is a stable update', async () => {
      stubChromeVersions({
        stableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (stable) to 2.0')
    })

    it('sets description correctly when there is a beta update', async () => {
      stubChromeVersions({
        betaVersion: '1.2',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (beta) to 1.2')
    })

    it('sets description correctly when there is a stable update and a beta update', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (stable) to 2.0 and Chrome (beta) to 2.1')
    })
  })

  context('.checkNeedForBranchUpdate', () => {
    beforeEach(() => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
      })
    })

    it('sets has_newer_update: true when there is a stable update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '2.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.2',
        latestStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a stable update and a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '2.1',
        latestStableVersion: '2.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: false when there is not a stable update or a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'false')
    })
  })

  context('.updateBrowserVersionsFile', () => {
    it('updates browser-versions.json with specified versions, leaving other entries in place', () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
      })

      sinon.stub(fs, 'writeFileSync')

      updateBrowserVersionsFile({
        latestBetaVersion: '2.1',
        latestStableVersion: '2.0',
      })

      expect(fs.writeFileSync).to.be.calledWith('./.circleci/workflows.yml', `chrome-stable-version: &chrome-stable-version "2.0"\nchrome-beta-version: &chrome-beta-version "2.1"\n`, 'utf8')
    })
  })

  context('.updatePRTitle', () => {
    it('updates pull request title', async () => {
      const github = {
        rest: {
          pulls: {
            list: sinon.stub().returns(Promise.resolve(
              {
                data: [
                  { number: '123' },
                ],
              },
            )),
            update: sinon.stub(),
          },
        },
      }

      const context = {
        repo: {
          owner: 'cypress-io',
          repo: 'cypress',
        },
      }

      await updatePRTitle({
        context,
        github,
        baseBranch: 'develop',
        branchName: 'some-branch-name',
        description: 'Update Chrome to newer version',
      })

      expect(github.rest.pulls.list).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        base: 'develop',
        head: 'cypress-io:some-branch-name',
      })

      expect(github.rest.pulls.update).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        pull_number: '123',
        title: 'chore: Update Chrome to newer version',
      })
    })

    it('logs and does not attempt to update pull request title if PR cannot be found', async () => {
      const github = {
        rest: {
          pulls: {
            list: sinon.stub().returns(Promise.resolve(
              {
                data: [],
              },
            )),
            update: sinon.stub(),
          },
        },
      }

      const context = {
        repo: {
          owner: 'cypress-io',
          repo: 'cypress',
        },
      }

      sinon.spy(console, 'log')

      await updatePRTitle({
        context,
        github,
        baseBranch: 'develop',
        branchName: 'some-branch-name',
        description: 'Update Chrome to newer version',
      })

      expect(github.rest.pulls.list).to.be.calledWith({
        owner: 'cypress-io',
        repo: 'cypress',
        base: 'develop',
        head: 'cypress-io:some-branch-name',
      })

      expect(github.rest.pulls.update).not.to.be.called
      expect(console.log).to.be.calledWith('Could not find PR for branch:', 'some-branch-name')
    })
  })
})
