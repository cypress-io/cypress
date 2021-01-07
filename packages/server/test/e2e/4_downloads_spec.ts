import path from 'path'

import e2e, { expect } from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'
import fs from '../../lib/util/fs'

const downloadsProject = Fixtures.projectPath('downloads')

describe('e2e downloads', () => {
  e2e.setup()

  e2e.it('handles various file downloads', {
    project: downloadsProject,
    spec: 'downloads_spec.ts',
    config: {
      video: false,
    },
  })

  it('trashes downloads between runs', async function () {
    await e2e.exec(this, {
      project: downloadsProject,
      spec: 'download_csv_spec.ts',
    })

    // this run should trash the downloads from the above run
    await e2e.exec(this, {
      project: downloadsProject,
      spec: 'simple_passing_spec.ts',
    })

    const filePath = path.join(downloadsProject, 'cypress', 'downloads', 'records.csv')
    const exists = await fs.pathExists(filePath)

    expect(exists, `Expected ${filePath} not to exist, but it does`).to.be.false
  })

  it('does not trash downloads between runs if trashAssetsBeforeRuns: false', async function () {
    await e2e.exec(this, {
      project: downloadsProject,
      spec: 'download_csv_spec.ts',
    })

    // this run should _not_ trash the downloads from the above run
    await e2e.exec(this, {
      project: downloadsProject,
      spec: 'simple_passing_spec.ts',
      config: {
        trashAssetsBeforeRuns: false,
      },
    })

    const filePath = path.join(downloadsProject, 'cypress', 'downloads', 'records.csv')
    const exists = await fs.pathExists(filePath)

    expect(exists, `Expected ${filePath} to exist, but it does not`).to.be.true
  })
})
