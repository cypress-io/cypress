import { describe, it, expect } from 'vitest'
import { spawnSync } from 'child_process'
import path from 'path'

const vitestBin = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs')

describe('sanitize-env global setup', () => {
  it('runs workers without the host variables but with the config env', { timeout: 30_000 }, () => {
    const result = spawnSync(process.execPath, [vitestBin, 'run'], {
      cwd: path.join(__dirname, '__fixtures__/project'),
      encoding: 'utf8',
      env: {
        ...process.env,
        CYPRESS_RECORD_KEY: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        DEBUG: 'cypress:*',
      },
    })

    expect(result.stdout + result.stderr).toContain('1 passed')
    expect(result.status).toBe(0)
  })
})
