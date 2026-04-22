const chai = require('chai')
const fs = require('fs')
const mockfs = require('mock-fs')
const sinon = require('sinon')

chai.use(require('sinon-chai'))

const { expect } = chai

const {
  getVersions,
  checkNeedForBranchUpdate,
  updateBrowserVersionsFile,
  updatePRTitle,
  CIRCLECI_WORKFLOWS_FILEPATH,
} = require('../../github-actions/update-browser-versions')

const coreStub = () => {
  return {
    setOutput: sinon.stub(),
  }
}

const pipelineStubContent = ({ betaVersion, stableVersion, chromeForTestingStableVersion }) => {
  return `chrome-stable-version: &chrome-stable-version "${stableVersion}"\nchrome-beta-version: &chrome-beta-version "${betaVersion}"\nchrome-for-testing-stable-version: &chrome-for-testing-stable-version "${chromeForTestingStableVersion}"\n`
}

const stubRepoVersions = ({ betaVersion, stableVersion, chromeForTestingStableVersion = '1.0' }) => {
  mockfs({
    [CIRCLECI_WORKFLOWS_FILEPATH]: pipelineStubContent({
      betaVersion,
      stableVersion,
      chromeForTestingStableVersion,
    }),
  })
}

const stubChromeVersions = ({ betaVersion, stableVersion, chromeForTestingStableVersion }) => {
  if (!global.originalFetch) {
    global.originalFetch = global.fetch
  }

  const stableResponse = {
    versions: stableVersion ? [{ name: `chrome/platforms/linux/channels/stable/versions/${stableVersion}`, version: stableVersion }] : [],
    nextPageToken: '',
  }

  const betaResponse = {
    versions: betaVersion ? [{ name: `chrome/platforms/linux/channels/beta/versions/${betaVersion}`, version: betaVersion }] : [],
    nextPageToken: '',
  }

  const cftVersion = chromeForTestingStableVersion !== undefined ? chromeForTestingStableVersion : '1.0'
  const cftBody = JSON.stringify({
    channels: {
      Stable: { channel: 'Stable', version: cftVersion },
    },
  })

  global.fetch = sinon.stub().callsFake((url) => {
    if (String(url).includes('chrome-for-testing/last-known-good-versions.json')) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(cftBody) })
    }

    if (url.includes('/channels/stable/')) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(stableResponse)) })
    }

    if (url.includes('/channels/beta/')) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(betaResponse)) })
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  })
}

describe('update browser version github action', () => {
  beforeEach(() => {
    sinon.restore()
    mockfs.restore()
  })

  afterEach(() => {
    if (global.originalFetch) {
      global.fetch = global.originalFetch
      delete global.originalFetch
    }
  })

  context('.getVersions', () => {
    beforeEach(() => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
      })
    })

    it('sets has_update: true when there is a stable update', async () => {
      stubChromeVersions({
        stableVersion: '2.0',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a beta update', async () => {
      stubChromeVersions({
        betaVersion: '1.2',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a stable update and a beta update', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a Chrome for Testing stable update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: false when there is not a stable update or a beta update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'false')
    })

    it('sets has_update: false if there is a failure', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'false')
    })

    it('sets versions', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
        chromeForTestingStableVersion: '3.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('current_stable_version', '1.0')
      expect(core.setOutput).to.be.calledWith('latest_stable_version', '2.0')
      expect(core.setOutput).to.be.calledWith('current_beta_version', '1.1')
      expect(core.setOutput).to.be.calledWith('latest_beta_version', '2.1')
      expect(core.setOutput).to.be.calledWith('current_chrome_for_testing_stable_version', '1.0')
      expect(core.setOutput).to.be.calledWith('latest_chrome_for_testing_stable_version', '3.0')
    })

    it('sets description correctly when there is a stable update', async () => {
      stubChromeVersions({
        stableVersion: '2.0',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (stable) to 2.0')
    })

    it('sets description correctly when there is a beta update', async () => {
      stubChromeVersions({
        betaVersion: '1.2',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (beta) to 1.2')
    })

    it('sets description correctly when there is a stable update and a beta update', async () => {
      stubChromeVersions({
        betaVersion: '2.1',
        stableVersion: '2.0',
        chromeForTestingStableVersion: '1.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome (stable) to 2.0 and Chrome (beta) to 2.1')
    })

    it('sets description correctly when there is a Chrome for Testing stable update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '2.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Chrome for Testing (stable) to 2.0')
    })

    it('does not set latest_chrome_for_testing_stable_version below the pinned value when only stable/beta update', async () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '147.0.0',
      })

      stubChromeVersions({
        stableVersion: '2.0',
        chromeForTestingStableVersion: '100.0.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('latest_chrome_for_testing_stable_version', '147.0.0')
      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })
  })

  context('.checkNeedForBranchUpdate', () => {
    beforeEach(() => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
      })
    })

    it('sets has_newer_update: true when there is a stable update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '2.0',
        latestChromeForTestingStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.2',
        latestStableVersion: '1.0',
        latestChromeForTestingStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a stable update and a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '2.1',
        latestStableVersion: '2.0',
        latestChromeForTestingStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a Chrome for Testing stable update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '1.0',
        latestChromeForTestingStableVersion: '2.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: false when there is not a stable update or a beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '1.0',
        latestChromeForTestingStableVersion: '1.0',
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'false')
    })
  })

  context('.updateBrowserVersionsFile', () => {
    it('updates browser-versions.json with specified versions, leaving other entries in place', () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
      })

      sinon.stub(fs, 'writeFileSync')

      updateBrowserVersionsFile({
        latestBetaVersion: '2.1',
        latestStableVersion: '2.0',
        latestChromeForTestingStableVersion: '2.2',
      })

      expect(fs.writeFileSync).to.be.calledWith(
        CIRCLECI_WORKFLOWS_FILEPATH,
        pipelineStubContent({
          stableVersion: '2.0',
          betaVersion: '2.1',
          chromeForTestingStableVersion: '2.2',
        }),
        'utf8',
      )
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
