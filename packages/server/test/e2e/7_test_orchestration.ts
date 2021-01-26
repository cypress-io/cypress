import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import e2e from '../support/helpers/e2e'
import { setupStubbedServer, createRoutes } from '../support/helpers/serverStub'
import Fixtures from '../support/helpers/fixtures'
const it = e2e.it
const e2ePath = Fixtures.projectPath('e2e')
const outputPath = path.join(e2ePath, 'output.json')
const expectProp = (obj, prop) => expect(_.get(obj, prop), prop)

describe('e2e test muting', () => {
  setupStubbedServer(createRoutes({
    postInstanceTests: {
      res: {
        actions: [
          {
            action: 'MUTE',
            clientId: 'r4',
            type: 'TEST',
          },
          {
            action: 'MUTE',
            clientId: 'r5',
            type: 'TEST',
          },
          {
            action: 'MUTE',
            clientId: 'r6',
            type: 'TEST',
          },
        ],
      },
    },
  }))

  it('failing and passing muted tests do not affect exit code or stats', {
    spec: 'test_muting_spec.js',
    key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
    record: true,
    config: {},
    snapshot: true,
    outputPath,
    async onRun (execFn) {
      await execFn()
      let json = await fs.readJSON(outputPath)

      console.log()
      expectProp(json, 'runs[0].stats.passes').eq(1)
      expectProp(json, 'runs[0].stats.failures').eq(0)
      expectProp(json, 'runs[0].stats.skipped').eq(0)
      expectProp(json, 'runs[0].stats.pending').eq(0)

      expectProp(json, 'runs[0].reporterStats.passes').eq(1)
      expectProp(json, 'runs[0].reporterStats.failures').eq(0)
      expectProp(json, 'runs[0].reporterStats.pending').eq(0)
    },
  })
})

describe('test muting in hooks', () => {
  setupStubbedServer(createRoutes({
    postInstanceTests: {
      res: {
        actions: [
          {
            action: 'MUTE',
            clientId: 'r3',
            type: 'TEST',
          },
        ],
      },
    },
  }))

  it('cannot mute failures in hooks', {
    spec: 'test_muting_hook_spec.js',
    key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
    record: true,
    config: {},
    snapshot: true,
    outputPath,
    expectedExitCode: 1,
    async onRun (execFn) {
      await execFn()
      let json = await fs.readJSON(outputPath)

      console.log()
      expectProp(json, 'runs[0].stats.passes').eq(0)
      expectProp(json, 'runs[0].stats.failures').eq(1)
      expectProp(json, 'runs[0].stats.skipped').eq(1)
      expectProp(json, 'runs[0].stats.pending').eq(0)

      expectProp(json, 'runs[0].reporterStats.passes').eq(0)
      expectProp(json, 'runs[0].reporterStats.failures').eq(1)
      expectProp(json, 'runs[0].reporterStats.pending').eq(0)
    },
  })
})
