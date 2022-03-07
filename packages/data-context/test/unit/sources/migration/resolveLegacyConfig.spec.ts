import { expect } from 'chai'
import { processConfigViaLegacyPlugins } from '../../../../src/actions'
import { getSystemTestProject } from '../../helper'

describe('processConfigViaLegacyPlugins', () => {
  it('executes legacy plugins and returns modified config', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-plugins-modify-config')
    const result = await processConfigViaLegacyPlugins(projectRoot, {})

    expect(result).to.eql({
      integrationFolder: 'tests/e2e',
      testFiles: '**/*.spec.js',
    })
  })

  it('works with cypress/plugins/index.ts and export default', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-export-default')
    const result = await processConfigViaLegacyPlugins(projectRoot, {
      retries: 10,
      viewportWidth: 8888,
    })

    expect(result).to.eql({
      retries: 10,
      viewportWidth: 1111, // mutated in plugins file
    })
  })

  it('handles pluginsFile: false', async () => {
    const projectRoot = getSystemTestProject('launchpad')
    const result = await processConfigViaLegacyPlugins(projectRoot, {
      retries: 10,
      viewportWidth: 8888,
    })

    expect(result).to.eql({
      retries: 10,
      viewportWidth: 8888,
    })
  })
})
