import { expect } from 'chai'
import path from 'path'
import { hasTypeScriptInstalled } from '../../../src/util'
import { scaffoldMigrationProject } from '../helper'

describe('hasTypeScript', () => {
  it('returns true when installed', async () => {
    const monorepoRoot = path.join(__dirname, '..', '..', '..', '..', '..')

    expect(hasTypeScriptInstalled(monorepoRoot)).to.be.true
  })

  it('returns false when not installed', async () => {
    const projectRoot = await scaffoldMigrationProject('config-with-js')

    expect(hasTypeScriptInstalled(projectRoot)).to.be.false
  })
})
