import path from 'path'

import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import { fs } from '@packages/server/lib/util/fs'

const downloadsProject = Fixtures.projectPath('downloads')

const downloadedFiles = ['records.csv', 'files.zip', 'people.xlsx']

// A download link never produces a browser pre-request, so the proxy depends on the
// browser reporting the click instead. When that report is missed the request is held
// for the full `PreRequests` timeout before it is served, making a correlation
// regression look like nothing worse than a slow download. Every line this namespace
// logs outside of `cypress-verbose` is a request that failed to correlate, so one
// naming a downloaded file is that regression.
const preRequestsDebugNamespace = 'cypress:proxy:http:util:prerequests'

const assertDownloadsWereCorrelated = (stderr: string) => {
  const uncorrelated = stderr.split('\n').filter((line) => {
    return line.includes(preRequestsDebugNamespace) && downloadedFiles.some((file) => line.includes(file))
  })

  expect(uncorrelated, `the proxy failed to correlate a download request:\n${uncorrelated.join('\n')}`).to.be.empty
}

describe('e2e downloads', () => {
  systemTests.setup({
    settings: {
      e2e: {
        supportFile: false,
      },
    },
  })

  systemTests.it('handles various file downloads', {
    project: 'downloads',
    spec: 'downloads.cy.ts',
    processEnv: {
      DEBUG: [process.env.DEBUG, preRequestsDebugNamespace].filter(Boolean).join(','),
    },
    onRun: async (exec) => {
      const { stderr } = await exec()

      assertDownloadsWereCorrelated(stderr)
    },
  })

  const fileExists = (fileName) => {
    return fs.pathExists(path.join(downloadsProject, 'cypress', 'dls', fileName))
  }

  systemTests.it('allows changing the downloads folder', {
    browser: '!webkit', // TODO(webkit): fix+unskip (implement downloads support)
    project: 'downloads',
    spec: 'downloads.cy.ts',
    config: {
      downloadsFolder: 'cypress/dls',
    },
    onRun: async (exec) => {
      await exec()

      expect(await fileExists('records.csv'), 'records.csv should exist').to.be.true
      expect(await fileExists('files.zip'), 'files.zip should exist').to.be.true
      expect(await fileExists('people.xlsx'), 'people.xlsx should exist').to.be.true
    },
  })

  it('trashes downloads between runs', async function () {
    await systemTests.exec(this, {
      project: 'downloads',
      spec: 'download_csv.cy.ts',
    })

    // this run should trash the downloads from the above run
    await systemTests.exec(this, {
      project: 'downloads',
      spec: 'simple_passing.cy.ts',
    })

    const filePath = path.join(downloadsProject, 'cypress', 'downloads', 'records.csv')
    const exists = await fs.pathExists(filePath)

    expect(exists, `Expected ${filePath} not to exist, but it does`).to.be.false
  })

  it('does not trash downloads between runs if trashAssetsBeforeRuns: false', async function () {
    this.retries(10)

    await systemTests.exec(this, {
      project: 'downloads',
      spec: 'download_csv.cy.ts',
    })

    // this run should _not_ trash the downloads from the above run
    await systemTests.exec(this, {
      project: 'downloads',
      spec: 'simple_passing.cy.ts',
      config: {
        trashAssetsBeforeRuns: false,
      },
    })

    const filePath = path.join(downloadsProject, 'cypress', 'downloads', 'records.csv')
    const exists = await fs.pathExists(filePath)

    expect(exists, `Expected ${filePath} to exist, but it does not`).to.be.true
  })
})
