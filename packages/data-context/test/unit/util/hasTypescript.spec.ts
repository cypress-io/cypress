import { describe, expect, it } from 'vitest'
import path from 'path'
import { hasTypeScriptInstalled } from '../../../src/util'
import { scaffoldMigrationProject } from '../helper'

describe('hasTypeScript', () => {
  it('returns true when installed', async () => {
    const monorepoRoot = path.join(__dirname, '..', '..', '..', '..', '..')

    expect(hasTypeScriptInstalled(monorepoRoot)).toBe(true)
  })

  it('returns false when not installed', async () => {
    const projectRoot = await scaffoldMigrationProject('config-with-js')

    expect(hasTypeScriptInstalled(projectRoot)).toBe(false)
  })
})
