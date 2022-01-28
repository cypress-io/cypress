import snapshot from 'snap-shot-it'
import path from 'path'
import fs from 'fs-extra'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  NonStandardMigrationError,
  supportFilesForMigration,
  renameSupportFilePath,
} from '../../../src/util/migration'
import { expect } from 'chai'
import tempDir from 'temp-dir'
import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  const tmpDir = path.join(tempDir, 'cy-projects')
  const testProject = path.join(__dirname, '..', '..', '..', '..', '..', 'system-tests', 'projects', project)
  const cwd = path.join(tmpDir, project)

  try {
    fs.rmSync(cwd, { recursive: true, force: true })
  } catch (e) {
    /* eslint-disable no-console */
    console.error(`error, could not remove ${cwd}`, e.message)
  }

  fs.copySync(testProject, cwd, { recursive: true })

  return cwd
}

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

// describe('spec renaming', () => {
//   it('should work for custom integration folder all specs', async () => {
//     const cwd = scaffoldMigrationProject('migration-e2e-custom-integration')
//     const specs = await getSpecs(cwd, null, 'src')

//     expect(specs).to.eql(
//       {
//         before: [{ relative: 'src/basic.spec.js', testingType: 'e2e' }],
//         after: [{ testingType: 'e2e', relative: 'src/basic.cy.js' }],
//       },
//     )
//   })

//   it('should work for default component folder all specs', async () => {
//     const cwd = scaffoldMigrationProject('migration-component-testing-defaults')
//     const specs = await getSpecs(cwd, 'cypress/component', null)

//     expect(specs).to.eql(
//       {
//         before: [
//           { relative: 'cypress/component/button.spec.js', testingType: 'component' },
//           { relative: 'cypress/component/input-spec.tsx', testingType: 'component' },
//         ],
//         after: [
//           { testingType: 'component', relative: 'cypress/component/button.cy.js' },
//           { testingType: 'component', relative: 'cypress/component/input.cy.tsx' },
//         ],
//       },
//     )
//   })

//   it('should rename all specs in default integration folder', async () => {
//     const cwd = scaffoldMigrationProject('migration')
//     const specs = await getSpecs(cwd, null, 'cypress/integration')

//     expect(specs.before[0].relative).to.eql('cypress/integration/app_spec.js')
//     expect(specs.after[0].relative).to.eql('cypress/e2e/app.cy.js')

//     expect(specs.before[1].relative).to.eql('cypress/integration/blog-post-spec.ts')
//     expect(specs.after[1].relative).to.eql('cypress/e2e/blog-post.cy.ts')

//     expect(specs.before[2].relative).to.eql('cypress/integration/company.js')
//     expect(specs.after[2].relative).to.eql('cypress/e2e/company.cy.js')

//     expect(specs.before[3].relative).to.eql('cypress/integration/homeSpec.js')
//     expect(specs.after[3].relative).to.eql('cypress/e2e/home.cy.js')

//     expect(specs.before[4].relative).to.eql('cypress/integration/sign-up.js')
//     expect(specs.after[4].relative).to.eql('cypress/e2e/sign-up.cy.js')

//     expect(specs.before[5].relative).to.eql('cypress/integration/spectacleBrowser.ts')
//     expect(specs.after[5].relative).to.eql('cypress/e2e/spectacleBrowser.cy.ts')

//     expect(specs.before[6].relative).to.eql('cypress/integration/someDir/someFile.js')
//     expect(specs.after[6].relative).to.eql('cypress/e2e/someDir/someFile.cy.js')
//   })
// })

describe('supportFilesForMigrationGuide', () => {
  it('finds and represents correct supportFile migration guide', async () => {
    const cwd = scaffoldMigrationProject('migration')
    const actual = await supportFilesForMigration(cwd)

    expect(actual.before[0]).to.eql({
      relative: 'cypress/support/index.js',
      parts: [
        {
          'text': 'cypress/support/',
          'highlight': false,
        },
        {
          'text': 'index',
          'highlight': true,
        },
        {
          'text': '.js',
          'highlight': false,
        },
      ],
      'testingType': 'e2e',
    })

    expect(actual.after[0]).to.eql({
      relative: 'cypress/support/e2e.js',
      parts: [
        {
          'text': 'cypress/support/',
          'highlight': false,
        },
        {
          'text': 'e2e',
          'highlight': true,
        },
        {
          'text': '.js',
          'highlight': false,
        },
      ],
      'testingType': 'e2e',
    })
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
    const cwd = scaffoldMigrationProject('migration-component-testing-customized')

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
