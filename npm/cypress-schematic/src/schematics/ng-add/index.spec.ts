import { describe, beforeEach, it, expect } from 'vitest'
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'
import { JsonObject } from '@angular-devkit/core'

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
    packageManager: 'yarn',
  }

  const appOptions = {
    name: 'sandbox',
    inlineTemplate: false,
    routing: false,
    skipTests: false,
    skipPackageJson: false,
  }

  const readAngularJson = (tree: UnitTestTree) => {
    return tree.readJson('/angular.json') as JsonObject
  }

  beforeEach(async () => {
    appTree = await schematicRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions)
    appTree = await schematicRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree)
  })

  it('should create cypress files for e2e testing by default', async () => {
    await schematicRunner.runSchematic('ng-add', {}, appTree).then((tree: UnitTestTree) => {
      const files = tree.files

      expect(files).to.contain('/projects/sandbox/cypress/e2e/spec.cy.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/e2e.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/commands.ts')
      expect(files).to.contain('/projects/sandbox/cypress/tsconfig.json')
      expect(files).to.contain('/projects/sandbox/cypress.config.ts')
      expect(files).to.contain('/projects/sandbox/cypress/fixtures/example.json')
    })
  })

  it('should create cypress files for component testing', async () => {
    await schematicRunner.runSchematic('ng-add', { 'component': true }, appTree).then((tree: UnitTestTree) => {
      const files = tree.files

      expect(files).to.contain('/projects/sandbox/cypress/support/component.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/component-index.html')
      expect(files).to.contain('/projects/sandbox/cypress/e2e/spec.cy.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/e2e.ts')
      expect(files).to.contain('/projects/sandbox/cypress/support/commands.ts')
      expect(files).to.contain('/projects/sandbox/cypress/tsconfig.json')
      expect(files).to.contain('/projects/sandbox/cypress.config.ts')
      expect(files).to.contain('/projects/sandbox/cypress/fixtures/example.json')
    })
  })

  it('should add @cypress/schematic to the schemaCollections array', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', { 'component': true }, appTree)
    const angularJson = readAngularJson(tree)
    const cliOptions = angularJson.cli as JsonObject

    expect(cliOptions).to.eql({
      packageManager: 'yarn',
      schematicCollections: ['@cypress/schematic', '@schematics/angular'],
    })
  })

  it('should not overwrite existing schemaCollections array', async () => {
    let angularJson = readAngularJson(appTree)

    appTree.overwrite('./angular.json', JSON.stringify({
      ...angularJson,
      cli: {
        schematicCollections: ['@any/schematic'],
      },
    }))

    const tree = await schematicRunner.runSchematic('ng-add', { 'component': true }, appTree)

    angularJson = readAngularJson(tree)
    const cliOptions = angularJson.cli as JsonObject

    expect(cliOptions).to.eql({
      schematicCollections: ['@cypress/schematic', '@any/schematic', '@schematics/angular'],
    })
  })
})
