import snapshot from 'snap-shot-it'
import path from 'path'
import fs from 'fs-extra'
import { createConfigString, getSpecs, formatMigrationFile, regexps } from '../../src/util/migration'
import { expect } from 'chai'
import tempDir from 'temp-dir'

// const util = require('util')
// const exec = util.promisify(require('child_process').exec)

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
      const tmpDir = path.join(tempDir, 'cy-projects')
      const testProject = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects', 'migration')
      const cwd = path.join(tmpDir, 'migration')

      try {
        fs.rmdirSync(cwd)
      } catch {
        // all good
      }

      fs.cpSync(testProject, cwd, { recursive: true })

      const specs = await getSpecs(cwd, 'cypress/component', 'cypress/integration')

      expect(specs.before[0].relative).to.eql('cypress/component/button.spec.js')
      expect(specs.after[0].relative).to.eql('cypress/component/button.cy.js')

      expect(specs.before[1].relative).to.eql('cypress/component/input-spec.tsx')
      expect(specs.after[1].relative).to.eql('cypress/component/input.cy.tsx')

      expect(specs.before[2].relative).to.eql('cypress/integration/app_spec.js')
      expect(specs.after[2].relative).to.eql('cypress/e2e/app.cy.js')

      expect(specs.before[3].relative).to.eql('cypress/integration/blog-post-spec.ts')
      expect(specs.after[3].relative).to.eql('cypress/e2e/blog-post.cy.ts')

      expect(specs.before[4].relative).to.eql('cypress/integration/company.js')
      expect(specs.after[4].relative).to.eql('cypress/e2e/company.cy.js')

      expect(specs.before[5].relative).to.eql('cypress/integration/homeSpec.js')
      expect(specs.after[5].relative).to.eql('cypress/e2e/home.cy.js')

      expect(specs.before[6].relative).to.eql('cypress/integration/sign-up.js')
      expect(specs.after[6].relative).to.eql('cypress/e2e/sign-up.cy.js')

      expect(specs.before[7].relative).to.eql('cypress/integration/spectacleBrowser.ts')
      expect(specs.after[7].relative).to.eql('cypress/e2e/spectacleBrowser.cy.ts')

      expect(specs.before[8].relative).to.eql('cypress/integration/someDir/someFile.js')
      expect(specs.after[8].relative).to.eql('cypress/e2e/someDir/someFile.cy.js')
    })
  })

  describe('formatMigrationFile', () => {
    it('breaks pre-migration spec into parts', () => {
      const spec = 'cypress/integration/app.spec.js'
      const re = new RegExp(regexps.e2e.beforeRegexp)
      const actual = formatMigrationFile(spec, re)

      expect(actual).to.eql([
        { text: 'cypress/', highlight: false },
        { text: 'integration', highlight: true },
        { text: '/app', highlight: false },
        { text: '.spec.', highlight: true },
        { text: 'js', highlight: false },
      ])
    })

    it('breaks post-migration spec into parts', () => {
      const spec = 'cypress/e2e/app.cy.js'
      const re = new RegExp(regexps.e2e.afterRegexp)
      const actual = formatMigrationFile(spec, re)

      expect(actual).to.eql([
        { text: 'cypress/', highlight: false },
        { text: 'e2e', highlight: true },
        { text: '/app', highlight: false },
        { text: '.cy.', highlight: true },
        { text: 'js', highlight: false },
      ])
    })
  })
})
