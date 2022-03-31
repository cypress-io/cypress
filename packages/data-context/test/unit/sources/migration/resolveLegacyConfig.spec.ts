import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import { processConfigViaLegacyPlugins } from '../../../../src/actions'
import { getSystemTestProject } from '../../helper'

describe('processConfigViaLegacyPlugins', () => {
  it('executes legacy plugins and returns modified config', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-plugins-modify-config')
    const result = await processConfigViaLegacyPlugins(projectRoot, {})

    expect(result).to.eql({
      'component': {
        'testFiles': '**/*.spec.ts',
      },
      'e2e': {
        'testFiles': '**/*.js',
      },
      'integrationFolder': 'tests/e2e',
      'retries': {
        'openMode': 0,
        'runMode': 1,
      },
      'testFiles': '**/*.spec.js',
    })
  })

  it('executes legacy plugins and returns without change if pluginsFile returns nothing', async () => {
    const projectRoot = getSystemTestProject('migration-e2e-defaults')
    const configFile = fs.readJsonSync(path.join(projectRoot, 'cypress.json'))
    const result = await processConfigViaLegacyPlugins(projectRoot, configFile)

    expect(result).to.eql(configFile)
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

  it('catches error', (done) => {
    const projectRoot = getSystemTestProject('migration-e2e-legacy-plugins-throws-error')

    processConfigViaLegacyPlugins(projectRoot, {})
    .catch((e) => {
      expect(e.originalError.message).to.eq('Uh oh, there was an error!')
      done()
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
