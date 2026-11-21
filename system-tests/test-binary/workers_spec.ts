import path from 'path'
import { fs } from '@packages/server/lib/util/fs'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('e2e binary --workers', () => {
  systemTests.it('reads the container memory limit and runs every spec across workers', {
    withBinary: true,
    dockerImage: 'cypress/base-internal:24.22.1-trixie',
    // one worker's estimated peak fits, two don't
    dockerMemoryMb: 2048,
    project: 'run-workers',
    browser: 'electron',
    workers: 2,
    expectedExitCode: 1,
    snapshot: false,
    timeout: 240000,
    async onRun (exec) {
      const outputPath = path.join(Fixtures.projectPath('run-workers'), 'output.json')
      const { stdout } = await exec({ outputPath })

      expect(stdout).to.include('Running 2 workers may run out of memory')
      expect(stdout).to.include('Running 6 specs on 2 workers')
      expect(stdout).not.to.include('exited early')

      const results = await fs.readJsonAsync(outputPath)

      expect(results.totalTests).to.eq(6)
      expect(results.totalFailed).to.eq(1)
    },
  })
})
