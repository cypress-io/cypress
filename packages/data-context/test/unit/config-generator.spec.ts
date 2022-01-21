import snapshot from 'snap-shot-it'
import { createConfigString, getSpecs } from '../../src/util/migration'
import { expect } from 'chai'
const util = require('util')
const exec = util.promisify(require('child_process').exec)

describe('migration utils', () => {
  describe('cypress.config.js generation', () => {
    it('should create a string when passed only a global option', async () => {
      const config = {
        visualViewport: 300,
      }

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })

    it('should create a string when passed only a e2e options', async () => {
      const config = {
        e2e: {
          baseUrl: 'localhost:3000',
        },
      }

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })

    it('should create a string when passed only a component options', async () => {
      const config = {
        component: {
          retries: 2,
        },
      }

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })

    it('should create a string for a config with global, component, and e2e options', async () => {
      const config = {
        visualViewport: 300,
        baseUrl: 'localhost:300',
        e2e: {
          retries: 2,
        },
        component: {
          retries: 1,
        },
      }

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })

    it('should create a string when passed an empty object', async () => {
      const config = {}

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })

    it('should exclude fields that are no longer valid', async () => {
      const config = {
        '$schema': 'http://someschema.com',
        pluginsFile: 'path/to/plugin/file',
        componentFolder: 'path/to/component/folder',
      }

      const generatedConfig = await createConfigString(config)

      snapshot(generatedConfig)
    })
  })

  describe('spec renaming', () => {
    it('should rename all specs', async () => {
      const { stdout } = await exec('git rev-parse --show-toplevel')
      const repoRoot = stdout.trim()
      const componentDirPath = `${repoRoot}/system-tests/projects/migration/cypress/component`
      const e2eDirPath = `${repoRoot}/system-tests/projects/migration/cypress/integration`
      const specs = await getSpecs(componentDirPath, e2eDirPath)

      expect(specs.after).to.have.length(8)
      expect(specs.before).to.have.length(8)
      expect(specs.before).to.include('cypress/component/button.spec.js')
      expect(specs.after).to.include('cypress/component/button.cy.js')
      expect(specs.before).to.include('cypress/integration/app_spec.js')
      expect(specs.after).to.include('cypress/e2e/app.cy.js')

      // not sure how to test this without messing up file tree
      //moveSpecFiles(e2eDirPath)
    })
  })
})
