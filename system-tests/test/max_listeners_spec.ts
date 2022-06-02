import _ from 'lodash'
import path from 'path'
import fs from 'fs-extra'

import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const projectPath = Fixtures.projectPath('max-listeners')

describe('max listeners warning spec', () => {
  systemTests.setup()

  // @see https://github.com/cypress-io/cypress/issues/1305
  systemTests.it('does not log MaxEventListeners error', {
    browser: 'electron',
    project: 'max-listeners',
    spec: '*',
    processEnv: {
      CYPRESS_INTERNAL_ENV: 'production',
    },
    onRun: async (exec) => {
      const integrationPath = path.join(projectPath, 'cypress/e2e')

      // create a bunch of dummy test files to reproduce #1305
      await fs.mkdirp(integrationPath)
      await Promise.all(
        _.times(15, (i) => fs.writeFile(path.join(integrationPath, `${i}.cy.js`), `it('test', () => {})`)),
      )

      const { stderr } = await exec()

      expect(stderr).to.not.include('setMaxListeners')
      expect(stderr).to.not.include('preprocessor:close')
    },
  })
})
