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
import { MigrationFile } from '../../../src/sources'

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

describe('supportFilesForMigrationGuide', () => {
  it('finds and represents correct supportFile migration guide', async () => {
    const cwd = scaffoldMigrationProject('migration')
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
            group: 'name',
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
            group: 'name',
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
