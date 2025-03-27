import { describe, it, beforeEach, expect } from 'vitest'
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
import { join } from 'path'

describe('ng-generate @cypress/schematic:spec', () => {
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

  it('should create cypress e2e spec file by default', async () => {
    const tree = await schematicRunner.runSchematic('spec', { name: 'foo', project: 'sandbox' }, appTree)

    expect(tree.files).to.contain('/projects/sandbox/cypress/e2e/foo.cy.ts')
  })

  it('should create cypress ct spec file when testingType is component', async () => {
    const tree = await schematicRunner.runSchematic('spec', { name: 'foo', project: 'sandbox', component: true }, appTree)

    expect(tree.files).to.contain('/projects/sandbox/src/app/foo.component.cy.ts')
  })
})
