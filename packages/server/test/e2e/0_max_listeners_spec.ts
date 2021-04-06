import _ from 'lodash'
import path from 'path'
import fs from 'fs-extra'

import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

const projectPath = Fixtures.projectPath('max-listeners')

describe('max listeners warning spec', () => {
  e2e.setup()

  // @see https://github.com/cypress-io/cypress/issues/1305
  e2e.it('does not log MaxEventListeners error', {
    browser: 'electron',
    project: projectPath,
    spec: '*',
    processEnv: {
      CYPRESS_INTERNAL_ENV: 'production',
    },
    onRun: async (exec) => {
      const integrationPath = path.join(projectPath, 'cypress/integration')

      // create a bunch of dummy test files to reproduce #1305
      await fs.mkdirp(integrationPath)
      await Promise.all(
        _.times(15, (i) => fs.writeFile(path.join(integrationPath, `${i}.spec.js`), `it('test', () => {})`)),
      )

      const { stderr } = await exec()

      expect(stderr).to.not.include('setMaxListeners')
      expect(stderr).to.not.include('preprocessor:close')
    },
  })
})
