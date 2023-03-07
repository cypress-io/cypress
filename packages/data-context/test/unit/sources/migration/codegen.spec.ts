import snapshot from 'snap-shot-it'
import path from 'path'
import fs from 'fs-extra'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  NonStandardMigrationError,
  supportFilesForMigration,
  reduceConfig,
  renameSupportFilePath,
} from '../../../../src/sources/migration'
import { expect } from 'chai'
import { MigrationFile } from '../../../../src/sources'
import { scaffoldMigrationProject, getSystemTestProject } from '../../helper'

const projectRoot = getSystemTestProject('migration-e2e-defaults')

describe('cypress.config.js generation', () => {
  it('generates correct config for component testing migration with custom testFiles glob', async () => {
    const config = {
      component: {
        testFiles: '**/*.spec.cy.{js,ts,jsx,tsx}',
        componentFolder: '.',
      },
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: false,
      hasComponentTesting: true,
      hasPluginsFile: false,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('generates correct config for component testing migration with custom testFiles array of glob', async () => {
    const config = {
      e2e: {
        testFiles: ['**/*.spec.js', '**/*.test.js'],
      },
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: false,
      hasPluginsFile: false,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: true,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string when passed only a global option', async () => {
    const config: Partial<Cypress.Config> = {
      viewportWidth: 300,
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string when passed only a e2e options', async () => {
    const config: Partial<Cypress.Config> = {
      e2e: {
        baseUrl: 'localhost:3000',
      },
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string when passed only a component options', async () => {
    const generatedConfig = await createConfigString({
      component: {
        retries: 2,
      },
    }, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create only a component entry when no e2e specs are detected', async () => {
    const generatedConfig = await createConfigString({}, {
      hasE2ESpec: false,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create only an e2e entry when no component specs are detected', async () => {
    const generatedConfig = await createConfigString({}, {
      hasE2ESpec: true,
      hasComponentTesting: false,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string for a config with global, component, and e2e options', async () => {
    const config = {
      viewportWidth: 300,
      baseUrl: 'localhost:300',
      slowTestThreshold: 500,
      e2e: {
        retries: 2,
      },
      component: {
        retries: 1,
      },
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string when passed an empty object', async () => {
    const config = {}

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should create a string when passed an empty object for an ECMA Script project', async () => {
    const config = {}

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      isProjectUsingESModules: true,
      shouldAddCustomE2ESpecPattern: false,
    })

    snapshot(generatedConfig)
  })

  it('should exclude fields that are no longer valid', async () => {
    const config = {
      '$schema': 'http://someschema.com',
      pluginsFile: './cypress/plugins/index.js',
      componentFolder: 'path/to/component/folder',
    }

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: false,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should handle export default in plugins file', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-export-default')
    const config = fs.readJsonSync(path.join(projectRoot, 'cypress.json'))

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: true,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should maintain both root level and nested non-breaking options during migration', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-component-default-everything')
    const config = await fs.readJson(path.join(projectRoot, 'cypress.json'))

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: true,
      shouldAddCustomE2ESpecPattern: false,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should add custom specPattern if project has projectId', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-defaults-with-projectId')
    const config = await fs.readJson(path.join(projectRoot, 'cypress.json'))

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: true,
      shouldAddCustomE2ESpecPattern: true,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })

  it('should not add custom specPattern if project has projectId and integrationFolder', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-defaults-with-projectId')
    const config = await fs.readJson(path.join(projectRoot, 'cypress.json'))

    config['integrationFolder'] = 'cypress/custom/e2e'

    const generatedConfig = await createConfigString(config, {
      hasE2ESpec: true,
      hasComponentTesting: true,
      hasPluginsFile: true,
      projectRoot,
      isUsingTypeScript: true,
      shouldAddCustomE2ESpecPattern: true,
      isProjectUsingESModules: false,
    })

    snapshot(generatedConfig)
  })
})

describe('supportFilesForMigrationGuide', () => {
  it('finds and represents correct supportFile migration guide', async () => {
    const cwd = await scaffoldMigrationProject('migration')
    const actual = await supportFilesForMigration(cwd)

    const expected: MigrationFile = {
      testingType: 'e2e',
      before: {
        relative: 'cypress/support/index.js',
        parts: [
          {
            'text': 'cypress/support/',
            'highlight': false,
          },
          {
            'text': 'index',
            'highlight': true,
            group: 'supportFileName',
          },
          {
            'text': '.js',
            'highlight': false,
          },
        ],
      },
      after: {
        relative: 'cypress/support/e2e.js',
        parts: [
          {
            'text': 'cypress/support/',
            'highlight': false,
          },
          {
            'text': 'e2e',
            'highlight': true,
            group: 'supportFileName',
          },
          {
            'text': '.js',
            'highlight': false,
          },
        ],
      },
    }

    // expect(actual.before).to.eql(expected.before)
    expect(actual.after).to.eql(expected.after)
  })
})

describe('renameSupportFilePath', () => {
  it('renames and keeps correct js extension', () => {
    const p = 'cypress/support/index.js'
    const actual = renameSupportFilePath(p)

    expect(actual).to.eq('cypress/support/e2e.js')
  })

  it('renames and keeps correct tsx extension', () => {
    const p = 'cypress/support/index.tsx'
    const actual = renameSupportFilePath(p)

    expect(actual).to.eq('cypress/support/e2e.tsx')
  })

  it('errors on non standard path', () => {
    const p = 'cypress/support/something-else.tsx'

    expect(() => renameSupportFilePath(p)).to.throw(NonStandardMigrationError)
  })
})

describe('initComponentTestingMigration', () => {
  it('calls callback with status each time file is removed', async () => {
    const cwd = await scaffoldMigrationProject('migration-component-testing-customized')

    const delay = () => new Promise((res) => setTimeout(res, 250))

    let updatedStatus: ComponentTestingMigrationStatus

    const onFileMoved = (_status: ComponentTestingMigrationStatus) => {
      updatedStatus = _status
    }

    const { status, watcher } = await initComponentTestingMigration(
      cwd,
      'src',
      ['**/*.{js,tsx}'],
      onFileMoved,
    )

    expect(status.completed).to.be.false
    expect(status.files).to.eql(new Map([
      ['src/button.spec.js', { moved: false,
        relative: 'src/button.spec.js',
      }],
      ['src/input-spec.tsx', {
        moved: false,
        relative: 'src/input-spec.tsx',
      }],
    ]))

    fs.moveSync(
      path.join(cwd, 'src', 'input-spec.tsx'),
      path.join(cwd, 'src', 'input.cy.tsx'),
    )

    // give watcher time to trigger
    await delay()

    expect(updatedStatus).to.eql({
      files: new Map([
        ['src/button.spec.js', { moved: false, relative: 'src/button.spec.js' }],
        ['src/input-spec.tsx', { moved: true, relative: 'src/input-spec.tsx' }],
      ]),
      completed: false,
    })

    fs.moveSync(
      path.join(cwd, 'src', 'button.spec.js'),
      path.join(cwd, 'src', 'button.cy.js'),
    )

    // give watcher time to trigger
    await delay()

    expect(updatedStatus).to.eql({
      files: new Map([
        ['src/button.spec.js', { moved: true, relative: 'src/button.spec.js' }],
        ['src/input-spec.tsx', { moved: true, relative: 'src/input-spec.tsx' }],
      ]),
      completed: true,
    })

    await watcher.close()
  })
})

describe('reduceConfig', () => {
  const options = {
    hasComponentTesting: false,
    hasE2ESpec: false,
    hasPluginsFile: false,
    projectRoot: '',
    isUsingTypeScript: false,
    isProjectUsingESModules: false,
    shouldAddCustomE2ESpecPattern: false,
  }

  it('should move the testFiles field to e2e and component', () => {
    const config = { testFiles: '**/**.cy.js' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.e2e.specPattern).to.eq('cypress/e2e/**/**.cy.js')
    expect(newConfig.component.specPattern).to.eq('**/**.cy.js')
  })

  it('should update integration folder for e2e when is set to default', () => {
    const config = { testFiles: '*.spec.js', integrationFolder: 'cypress/integration' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.e2e.specPattern).to.eq(`cypress/e2e/${config.testFiles}`)
  })

  it('should combine componentFolder and integrationFolder with testFiles field in component', () => {
    const config = { testFiles: '**/**.cy.js', componentFolder: 'src', integrationFolder: 'cypress/src' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.component.specPattern).to.eq('src/**/**.cy.js')
    expect(newConfig.e2e.specPattern).to.eq(`${config.integrationFolder}/${config.testFiles}`)
  })

  it('should combine nested componentFolder and integrationFolder with testFiles field in component', () => {
    const config = {
      testFiles: '**/**.cy.js',
      component: {
        componentFolder: 'src',
      },
      e2e: {
        integrationFolder: 'cypress/src',
      },
    }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.component.componentFolder).to.not.exist
    expect(newConfig.component.specPattern).to.eq('src/**/**.cy.js')
    expect(newConfig.e2e.specPattern).to.eq(`${config.e2e.integrationFolder}/${config.testFiles}`)
  })

  it('should add custom integrationFolder to default testFiles if testFiles is not present', () => {
    const config = { integrationFolder: 'cypress/custom-integration' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.e2e.specPattern).to.eq(`${config.integrationFolder}/**/*.cy.{js,jsx,ts,tsx}`)
  })

  it('should add custom integrationFolder to default testFiles if testFiles is not present and shouldAddCustomE2ESpecPattern is true', () => {
    const config = { integrationFolder: 'cypress/custom-integration' }
    const newConfig = reduceConfig(config, { ...options, shouldAddCustomE2ESpecPattern: true })

    expect(newConfig.e2e.specPattern).to.eq(`${config.integrationFolder}/**/*.{js,jsx,ts,tsx}`)
  })

  it('should combine testFiles with highest specificity', () => {
    const config = {
      testFiles: '**/**.cy.js',
      componentFolder: 'lower/specificity',
      integrationFolder: 'lower/specificity',
      component: {
        componentFolder: 'higher/specificity',
      },
      e2e: {
        integrationFolder: 'higher/specificity',
      },
    }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.component.specPattern).to.eq(`higher/specificity/**/**.cy.js`)
    expect(newConfig.e2e.specPattern).to.eq(`${config.e2e.integrationFolder}/${config.testFiles}`)
  })

  it('should exclude integrationFolder and componentFolder', () => {
    const config = {
      componentFolder: 'src',
      integrationFolder: 'cypress/integration',
    }

    const newConfig = reduceConfig(config, options)

    // @ts-ignore field not on ConfigOptions type
    expect(newConfig.global.componentFolder).to.not.exist
    // @ts-ignore field not on ConfigOptions type
    expect(newConfig.global.integrationFolder).to.not.exist
  })

  it('should rename ignoreTestFiles to excludeSpecPattern', () => {
    const config = { ignoreTestFiles: 'path/to/**/*.js' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.e2e.excludeSpecPattern).to.eq(config.ignoreTestFiles)
    expect(newConfig.component.excludeSpecPattern).to.eq(config.ignoreTestFiles)
  })

  it('should nest supportFile under component and e2e', () => {
    const config = { supportFile: 'cypress/support/mySupportFile.js' }
    const newConfig = reduceConfig(config, options)

    expect(newConfig.e2e.supportFile).to.eq(config.supportFile)
  })

  it('should not add supportFile if it is the default one', () => {
    expect(reduceConfig({ supportFile: null }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: undefined }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: 'cypress/support' }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: 'cypress/support/index' }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: 'cypress/support/index.js' }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: './cypress/support/index.js' }, options).e2e.supportFile).to.not.exist
    expect(reduceConfig({ supportFile: '../cypress/support/index.js' }, options).e2e.supportFile).to.not.exist
  })

  it('should exclude the pluginsFile', () => {
    const config = { pluginsFile: 'cypress/plugins/index.js' }
    const newConfig = reduceConfig(config, options)

    // @ts-ignore field not on ConfigOptions type
    expect(newConfig.global.pluginsFile).to.not.exist
  })
})
