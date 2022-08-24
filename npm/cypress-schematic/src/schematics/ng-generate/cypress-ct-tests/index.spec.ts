/// <reference path="../../../../../../cli/types/mocha/index.d.ts" />

import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'
import { expect } from 'chai'
import { take } from 'rxjs/operators'

describe('ng-generate @cypress/schematic:specs-ct', () => {
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

  it('should create cypress component tests alongside components', async () => {
    return schematicRunner.runSchematicAsync('specs-ct', { project: 'sandbox' }, appTree).pipe(take(1)).subscribe((tree: UnitTestTree) => expect(tree.files).to.contain('/projects/sandbox/app/src/app.component.cy.ts'))
  })
})
