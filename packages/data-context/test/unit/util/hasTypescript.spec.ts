import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { execFileSync } from 'child_process'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { getSystemTestProject } from '../helper'

const HAS_TYPESCRIPT_PATH = path.join(__dirname, '..', '..', '..', 'src', 'util', 'hasTypescript.ts')

describe('hasTypeScript', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-has-typescript-'))
  })

  afterEach(async () => {
    await fs.remove(tmpDir)
  })

  // Resolution also searches NODE_PATH and ~/.node_modules, which make TypeScript
  // resolvable from any directory on a machine that installs it globally. Running
  // in a separate Node process without them limits the search to the project's own
  // node_modules hierarchy, the same as on a machine without a global install.
  const hasTypeScriptInstalled = (projectRoot: string): boolean => {
    const { NODE_PATH, CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL, ...env } = process.env

    const stdout = execFileSync(process.execPath, [
      '--require', require.resolve('tsx/cjs'),
      '-e', 'process.stdout.write(JSON.stringify(require(process.argv[1]).hasTypeScriptInstalled(process.argv[2])))',
      HAS_TYPESCRIPT_PATH,
      projectRoot,
    ], { cwd: tmpDir, env: { ...env, HOME: tmpDir, USERPROFILE: tmpDir }, encoding: 'utf8' })

    return JSON.parse(stdout)
  }

  it('returns true when installed', () => {
    const monorepoRoot = path.join(__dirname, '..', '..', '..', '..', '..')

    expect(hasTypeScriptInstalled(monorepoRoot)).toBe(true)
  })

  it('returns false when not installed', async () => {
    // Copied outside the shared scaffold directory, whose node_modules other specs
    // link TypeScript into.
    const projectRoot = path.join(tmpDir, 'config-with-js')

    await fs.copy(getSystemTestProject('config-with-js'), projectRoot)

    expect(hasTypeScriptInstalled(projectRoot)).toBe(false)
  })
})
