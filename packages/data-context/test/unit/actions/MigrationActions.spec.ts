import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getConfigWithDefaults, getDiff } from '../../../src/actions/MigrationActions'
import fs from 'fs-extra'
import Fixtures from '@tooling/system-tests'
import { createTestDataContext, scaffoldMigrationProject } from '../helper'
import path from 'path'

chai.use(chaiAsPromised)

describe('MigrationActions', () => {
  context('getConfigWithDefaults', () => {
    it('returns a config with defaults without touching the original', () => {
      const config = {
        foo: 'bar',
      }

      expect(getConfigWithDefaults(config)).to.have.property('env')
      expect(getConfigWithDefaults(config)).to.have.property('browsers')
      expect(config).not.to.have.property('env')
      expect(config).not.to.have.property('browsers')
    })
  })

  context('getDiff', () => {
    it('returns all the updated values', () => {
      const oldConfig = {
        foo: 'bar',
        other: 'config',
        removed: 'value',
        updated: 'oldValue',
      }

      const newConfig = {
        foo: 'hello',
        other: 'config',
        updated: 'newValue',
      }

      const diff = getDiff(oldConfig, newConfig)

      expect(diff).to.have.property('foo', 'hello')
      expect(diff).to.have.property('updated', 'newValue')
      expect(diff).not.to.have.property('removed')
    })
  })

  describe('#initialize', () => {
    let currentProject: string

    beforeEach(async () => {
      Fixtures.clearFixtureNodeModules('migration')
      currentProject = await scaffoldMigrationProject('migration')
    })

    // simulate having a specific version of cypress installed
    // in a project's local node_modules
    function mockLocallyInstalledCypress (projectRoot: string, version: string) {
      const mockPkgJson = {
        version,
        main: 'index.js',
      }
      const mockCypressDir = path.join(projectRoot, 'node_modules', 'cypress')

      fs.mkdirSync(mockCypressDir, { recursive: true })
      fs.createFileSync(path.join(mockCypressDir, 'index.js'))
      fs.writeJsonSync(path.join(mockCypressDir, 'package.json'), mockPkgJson)
    }

    it('errors when local cypress version is <10', () => {
      mockLocallyInstalledCypress(currentProject, '9.5.0')
      const ctx = createTestDataContext()

      ctx.update((coreData) => {
        coreData.currentProject = currentProject
        coreData.currentTestingType = 'e2e'
        coreData.app.isGlobalMode = true
      })

      return (
        expect(ctx.actions.migration.initialize({})).to.eventually.be.rejectedWith(
          'You are running Cypress version 10 in global mode, but you are attempting to migrate a project where Cypress version 9.5.0 is installed',
        )
      )
    })

    it('does not error when local cypress version is 10', () => {
      mockLocallyInstalledCypress(currentProject, '10.0.0')
      const ctx = createTestDataContext()

      ctx.update((coreData) => {
        coreData.currentProject = currentProject
        coreData.currentTestingType = 'e2e'
      })

      return (
        expect(ctx.actions.migration.initialize({})).to.eventually.not.be.rejected
      )
    })
  })
})
