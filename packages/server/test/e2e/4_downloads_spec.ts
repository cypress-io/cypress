import fs from 'fs-extra'
import path from 'path'

import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e downloads', () => {
  e2e.setup()

  e2e.it('handles various file downloads', {
    project: Fixtures.projectPath('downloads'),
    spec: '*',
    config: {
      video: false,
    },
  })

  const fileExists = (fileName) => {
    return fs.pathExists(path.join(Fixtures.projectPath('downloads'), 'cypress', 'dls', fileName))
  }

  e2e.it('allows changing the downloads folder', {
    project: Fixtures.projectPath('downloads'),
    spec: '*',
    config: {
      downloadsFolder: 'cypress/dls',
      video: false,
    },
    onRun: async (exec) => {
      await exec()

      expect(await fileExists('records.csv'), 'records.csv should exist').to.be.true
      expect(await fileExists('files.zip'), 'files.zip should exist').to.be.true
      expect(await fileExists('people.xlsx'), 'people.xlsx should exist').to.be.true
    },
  })
})
