import { Architect } from '@angular-devkit/architect'
import { TestingArchitectHost } from '@angular-devkit/architect/testing'
import { schema } from '@angular-devkit/core'
import { join } from 'path'

describe('@cypress/schematic: builder', () => {
  let architect: Architect
  let architectHost: TestingArchitectHost

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry()

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

    registry.addPostTransform(schema.transforms.addUndefinedDefaults)

    // TestingArchitectHost() takes workspace and current directories.
    architectHost = new TestingArchitectHost('sandbox', __dirname)
    architect = new Architect(architectHost, registry)

    // This will either take a Node package name, or a path to the directory
    // for the package.json file.
    await architectHost.addBuilderFromPackage(join(__dirname, './../../..'))
  })

  it('runs cypress', async () => {
    const run = await architect.scheduleBuilder('@cypress/schematic:cypress', {
      headless: false,
      record: true, // set to false if you do not want this to record
      key: '8298e715-8fdc-41b7-ac18-389345a1b06a', //set this to any key
    })

    const output = await run.result

    // Stop the builder from running. This stops Architect from keeping
    // the builder-associated states in memory, since builders keep waiting
    // to be scheduled.
    await run.stop()

    // Expect that the test was successful
    expect(output).toEqual(jasmine.objectContaining({
      success: true,
    }))
  })
})
