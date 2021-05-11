import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'

// const NUMBER_OF_SCAFFOLDED_FILES = 36;

describe('@cypress/schematic: ng-add', () => {
  const schematicRunner = new SchematicTestRunner(
    'schematics',
    join(__dirname, './../collection.json'),
  )

  let appTree: UnitTestTree

  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
    defaultProject: 'sandbox',
  }

  const appOptions = {
    name: 'sandbox',
    inlineTemplate: false,
    routing: false,
    skipTests: false,
    skipPackageJson: false,
  }

  beforeEach(async () => {
    appTree = await schematicRunner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise()
    appTree = await schematicRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree).toPromise()
  })

  it('should create cypress files', async () => {
    const files = ['integration/spec.ts', 'plugins/index.js', 'support/commands.ts', 'support/index.ts', 'tsconfig.json', 'cypress.json']
    const homePath = '/projects/sandbox/cypress/'

    schematicRunner.runSchematicAsync('ng-add', {}, appTree).toPromise().then((tree) => {
      files.forEach((f) => {
        const path = `${homePath}${f}`

        expect(tree.exists(path)).toEqual(true)
      })
    })
  })
})
