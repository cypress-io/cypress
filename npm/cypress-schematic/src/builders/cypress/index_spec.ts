import { Architect } from '@angular-devkit/architect'
import { TestingArchitectHost } from '@angular-devkit/architect/testing'
import { schema } from '@angular-devkit/core'
import { join } from 'path'
import { expect } from 'chai'

describe('@cypress/schematic: builder', () => {
  let architect: Architect
  let architectHost: TestingArchitectHost

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry()

    registry.addPostTransform(schema.transforms.addUndefinedDefaults)

    // TestingArchitectHost() takes workspace and current directories.
    architectHost = new TestingArchitectHost('sandbox', __dirname)
    architect = new Architect(architectHost, registry)

    // This will either take a Node package name, or a path to the directory
    // for the package.json file.
    const pathname = join(__dirname, './../../..')

    await architectHost.addBuilderFromPackage(pathname)
  })

  it('runs cypress', async () => {
    const run = await architect.scheduleBuilder('@cypress/schematic:cypress', {
      devServerTarget: 'sandbox:serve',
    })

    const output = await run.result

    console.log('🚀 ~ file: index_spec.ts ~ line 33 ~ it ~ output', output)

    // Stop the builder from running. This stops Architect from keeping
    // the builder-associated states in memory, since builders keep waiting
    // to be scheduled.
    await run.stop()

    // Expect that the test was successful
    expect(output).to.have.property('success', true)
  })
})
