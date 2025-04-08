import { describe, it, beforeEach, expect } from 'vitest'
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'

describe('ng-generate @cypress/schematic:specs-ct', () => {
  const schematicRunner = new SchematicTestRunner(
    'schematics',
    join(__dirname, '../../collection.json'),
  )
  let appTree: UnitTestTree

  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '18.0.0',
  }

  const appOptions: Parameters<typeof schematicRunner['runExternalSchematic']>[2] = {
    name: 'sandbox',
    inlineTemplate: false,
    routing: false,
    skipTests: false,
    skipPackageJson: false,
  }

  beforeEach(async () => {
    appTree = await schematicRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions)
    appTree = await schematicRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree)
  })

  it('should create cypress component tests alongside components', async () => {
    const tree = await schematicRunner.runSchematic('specs-ct', { project: 'sandbox' }, appTree)

    expect(tree.files).to.contain('/projects/sandbox/src/fake-component.component.cy.ts')
  })
})
