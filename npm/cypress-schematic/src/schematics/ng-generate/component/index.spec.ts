import { describe, beforeEach, it, expect } from 'vitest'
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing'
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

  it('should create cypress ct alongside the generated component', async () => {
    const tree = await schematicRunner.runSchematic('component', { name: 'foo', project: 'sandbox', skipImport: true }, appTree)

    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.html')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.cy.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/foo.component.css')
    expect(tree.files).not.to.contain('/projects/sandbox/src/app/foo/foo.component.spec.ts')
  })

  it('should not generate component which does exist already', async () => {
    let tree = await schematicRunner.runSchematic('component', { name: 'foo', project: 'sandbox', skipImport: true }, appTree)

    tree = await schematicRunner.runSchematic('component', { name: 'foo', project: 'sandbox', skipImport: true }, appTree)

    expect(tree.files.filter((f) => f === '/projects/sandbox/src/app/foo/foo.component.ts').length).to.eq(1)
    expect(tree.files.filter((f) => f === '/projects/sandbox/src/app/foo/foo.component.html').length).to.eq(1)
    expect(tree.files.filter((f) => f === '/projects/sandbox/src/app/foo/foo.component.cy.ts').length).to.eq(1)
    expect(tree.files.filter((f) => f === '/projects/sandbox/src/app/foo/foo.component.css').length).to.eq(1)
  })

  it('should generate component given a component containing a directory', async () => {
    const tree = await schematicRunner.runSchematic('component', { name: 'foo/bar', project: 'sandbox', skipImport: true }, appTree)

    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/bar/bar.component.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/bar/bar.component.html')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/bar/bar.component.cy.ts')
    expect(tree.files).to.contain('/projects/sandbox/src/app/foo/bar/bar.component.css')
  })
})
