import { expect } from 'chai'
import { getBunCommand } from '../lib/dep-installer/bun'

describe('dep-installer bun command', () => {
  it('throws when _cyYarnV311 is enabled', () => {
    expect(() => {
      getBunCommand({
        yarnV311: true,
        updateLockFile: false,
        isCI: true,
        runScripts: true,
      })
    }).to.throw('_cyYarnV311 is not supported with BUN.')
  })

  it('builds a bun install command when _cyYarnV311 is disabled', () => {
    const command = getBunCommand({
      yarnV311: false,
      updateLockFile: false,
      isCI: true,
      runScripts: true,
    })

    expect(command.cmd).to.eq('bun install --frozen-lockfile')
    expect(command.env).to.have.property('BUN_INSTALL_CACHE_DIR')
  })
})
