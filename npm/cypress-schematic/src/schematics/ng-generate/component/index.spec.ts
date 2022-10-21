import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { expect } from 'chai'
import { join } from 'path'

describe('ng-generate @cypress/schematic:component', () => {
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

  const appOptions: Parameters<typeof schematicRunner['runExternalSchematicAsync']>[2] = {
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

  it('should create cypress ct alongside the generated component', async () => {
    const tree = await schematicRunner.runSchematicAsync('component', { name: 'foo', project: 'sandbox' }, appTree).toPromise()

    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.html')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.spec.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.css')
  })
})
