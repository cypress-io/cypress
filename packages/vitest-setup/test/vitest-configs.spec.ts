import { it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../../..')

it('every package vitest config runs the sanitize-env global setup', async () => {
  const configs = execFileSync('git', ['ls-files', '*vitest.config.ts', '*vitest.config.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && file !== 'vitest.config.ts')

  expect(configs.length).toBeGreaterThan(0)

  const contents = await Promise.all(configs.map((file) => fs.readFile(path.join(repoRoot, file), 'utf8')))
  const missing = configs.filter((file, i) => !contents[i].includes(`'@packages/vitest-setup/sanitize-env'`))

  expect(missing).toEqual([])
})
