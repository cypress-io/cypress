/// <reference path="../../../../../cli/types/mocha/index.d.ts" />

import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'
import { expect } from 'chai'

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
    return schematicRunner.runSchematicAsync('ng-add', {}, appTree).toPromise().then((tree) => {
      const files = tree.files

      expect(files).to.contain('/projects/sandbox/cypress/e2e/spec.cy.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/e2e.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/commands.ts')
      expect(files).to.contain('/projects/sandbox/cypress/tsconfig.json')
      expect(files).to.contain('/projects/sandbox/cypress.config.ts')
      expect(files).to.contain('/projects/sandbox/cypress/fixtures/example.json')
    })
  })
})
