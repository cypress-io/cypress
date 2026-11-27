import { it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../../..')

const SANITIZE_ENV_SETUP = /globalSetup:\s*\[[^\]]*['"]@packages\/vitest-setup\/sanitize-env['"]/

const stripComments = (source: string) => {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

it('every package vitest config runs the sanitize-env global setup', async () => {
  // HOME is stripped, so git can't read a global safe.directory entry
  const configs = execFileSync('git', ['-c', `safe.directory=${repoRoot}`, 'ls-files', ':(glob)**/vitest.config.*'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && file !== 'vitest.config.ts')

  expect(configs.length).toBeGreaterThan(0)

  const contents = await Promise.all(configs.map((file) => fs.readFile(path.join(repoRoot, file), 'utf8')))
  const missing = configs.filter((file, i) => !SANITIZE_ENV_SETUP.test(stripComments(contents[i])))

  expect(missing).toEqual([])
})
