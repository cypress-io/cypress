import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join, resolve } from 'path'
import { expect } from 'chai'

describe('@cypress/schematic:e2e ng-generate', () => {
  const schematicRunner = new SchematicTestRunner(
    'schematics',
    join(__dirname, '../../collection.json'),
  )
  let appTree: UnitTestTree

  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '12.0.0',
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
    const files = ['cypress/integration/foo.spec.ts']
    const homePath = '/projects/sandbox/'

    return schematicRunner.runSchematicAsync('e2e', { name: 'foo' }, appTree).toPromise().then((tree) => {
      files.forEach((f) => {
        const pathToFile = resolve(homePath, f)

        expect(tree.exists(pathToFile), pathToFile).equal(true)
      })
    })
  })
})
