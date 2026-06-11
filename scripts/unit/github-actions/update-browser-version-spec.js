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

const DEFAULT_FIREFOX_STABLE = '100.0'
const DEFAULT_FIREFOX_BETA = '101.0b1'

const pipelineStubContent = ({
  betaVersion,
  stableVersion,
  chromeForTestingStableVersion,
  firefoxStableVersion = DEFAULT_FIREFOX_STABLE,
  firefoxBetaVersion = DEFAULT_FIREFOX_BETA,
}) => {
  return [
    `chrome-stable-version: &chrome-stable-version "${stableVersion}"`,
    `chrome-beta-version: &chrome-beta-version "${betaVersion}"`,
    `chrome-for-testing-stable-version: &chrome-for-testing-stable-version "${chromeForTestingStableVersion}"`,
    `firefox-stable-version: &firefox-stable-version "${firefoxStableVersion}"`,
    `firefox-beta-version: &firefox-beta-version "${firefoxBetaVersion}"`,
    '',
  ].join('\n')
}

const stubRepoVersions = ({
  betaVersion,
  stableVersion,
  chromeForTestingStableVersion = '1.0',
  firefoxStableVersion = DEFAULT_FIREFOX_STABLE,
  firefoxBetaVersion = DEFAULT_FIREFOX_BETA,
}) => {
  mockfs({
    [CIRCLECI_WORKFLOWS_FILEPATH]: pipelineStubContent({
      betaVersion,
      stableVersion,
      chromeForTestingStableVersion,
      firefoxStableVersion,
      firefoxBetaVersion,
    }),
  })
}

const stubChromeVersions = ({
  betaVersion,
  stableVersion,
  chromeForTestingStableVersion,
  firefoxStableVersion = DEFAULT_FIREFOX_STABLE,
  firefoxBetaVersion = DEFAULT_FIREFOX_BETA,
}) => {
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

  const firefoxBody = JSON.stringify({
    LATEST_FIREFOX_VERSION: firefoxStableVersion,
    LATEST_FIREFOX_RELEASED_DEVEL_VERSION: firefoxBetaVersion,
  })

  global.fetch = sinon.stub().callsFake((url) => {
    if (String(url).includes('chrome-for-testing/last-known-good-versions.json')) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(cftBody) })
    }

    if (String(url).includes('product-details.mozilla.org')) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(firefoxBody) })
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

    it('sets has_update: true when there is a Firefox stable update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        firefoxStableVersion: '101.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('has_update', 'true')
    })

    it('sets has_update: true when there is a Firefox beta update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        firefoxBetaVersion: '102.0b3',
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
        firefoxStableVersion: '101.0',
        firefoxBetaVersion: '102.0b3',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('current_stable_version', '1.0')
      expect(core.setOutput).to.be.calledWith('latest_stable_version', '2.0')
      expect(core.setOutput).to.be.calledWith('current_beta_version', '1.1')
      expect(core.setOutput).to.be.calledWith('latest_beta_version', '2.1')
      expect(core.setOutput).to.be.calledWith('current_chrome_for_testing_stable_version', '1.0')
      expect(core.setOutput).to.be.calledWith('latest_chrome_for_testing_stable_version', '3.0')
      expect(core.setOutput).to.be.calledWith('current_firefox_stable_version', DEFAULT_FIREFOX_STABLE)
      expect(core.setOutput).to.be.calledWith('latest_firefox_stable_version', '101.0')
      expect(core.setOutput).to.be.calledWith('current_firefox_beta_version', DEFAULT_FIREFOX_BETA)
      expect(core.setOutput).to.be.calledWith('latest_firefox_beta_version', '102.0b3')
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

    it('sets description correctly when there is a Firefox stable update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        firefoxStableVersion: '101.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Firefox (stable) to 101.0')
    })

    it('sets description correctly when there is a Firefox beta update', async () => {
      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        firefoxBetaVersion: '102.0b3',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('description', 'Update Firefox (beta) to 102.0b3')
    })

    it('sets description correctly when Chrome and Firefox both update', async () => {
      stubChromeVersions({
        stableVersion: '2.0',
        chromeForTestingStableVersion: '1.0',
        firefoxStableVersion: '101.0',
        firefoxBetaVersion: '102.0b3',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith(
        'description',
        'Update Chrome (stable) to 2.0 and Firefox (stable) to 101.0 and Firefox (beta) to 102.0b3',
      )
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

    it('does not set latest_firefox_stable_version below the pinned value when the upstream value is older', async () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
        firefoxStableVersion: '150.0',
      })

      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        firefoxStableVersion: '100.0',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('latest_firefox_stable_version', '150.0')
    })

    it('does not set latest_firefox_beta_version below the pinned value when the upstream beta is older', async () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
        firefoxBetaVersion: '152.0b5',
      })

      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        // Upstream regressed within the same main version (152.0b1 < 152.0b5).
        firefoxBetaVersion: '152.0b1',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('latest_firefox_beta_version', '152.0b5')
      expect(core.setOutput).to.be.calledWith('has_update', 'false')
    })

    it('does not set latest_firefox_beta_version below the pinned value when upstream main version regressed', async () => {
      stubRepoVersions({
        betaVersion: '1.1',
        stableVersion: '1.0',
        chromeForTestingStableVersion: '1.0',
        firefoxBetaVersion: '152.0b1',
      })

      stubChromeVersions({
        chromeForTestingStableVersion: '1.0',
        // Mozilla rolled back to a 151 beta — don't downgrade.
        firefoxBetaVersion: '151.0b9',
      })

      const core = coreStub()

      await getVersions({ core })

      expect(core.setOutput).to.be.calledWith('latest_firefox_beta_version', '152.0b1')
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
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
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
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
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
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
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
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a Firefox stable update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '1.0',
        latestChromeForTestingStableVersion: '1.0',
        latestFirefoxStableVersion: '999.0',
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'true')
    })

    it('sets has_newer_update: true when there is a Firefox beta update', () => {
      const core = coreStub()

      checkNeedForBranchUpdate({
        core,
        latestBetaVersion: '1.1',
        latestStableVersion: '1.0',
        latestChromeForTestingStableVersion: '1.0',
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: '999.0b9',
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
        latestFirefoxStableVersion: DEFAULT_FIREFOX_STABLE,
        latestFirefoxBetaVersion: DEFAULT_FIREFOX_BETA,
      })

      expect(core.setOutput).to.be.calledWith('has_newer_update', 'false')
    })
  })

  context('.updateBrowserVersionsFile', () => {
    it('updates pipeline file with specified versions, leaving other entries in place', () => {
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
        latestFirefoxStableVersion: '101.0',
        latestFirefoxBetaVersion: '102.0b3',
      })

      expect(fs.writeFileSync).to.be.calledWith(
        CIRCLECI_WORKFLOWS_FILEPATH,
        pipelineStubContent({
          stableVersion: '2.0',
          betaVersion: '2.1',
          chromeForTestingStableVersion: '2.2',
          firefoxStableVersion: '101.0',
          firefoxBetaVersion: '102.0b3',
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
