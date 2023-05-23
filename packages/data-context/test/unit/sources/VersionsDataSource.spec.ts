import { expect } from 'chai'
import os from 'os'
import sinon from 'sinon'
import { Response } from 'cross-fetch'

import { DataContext } from '../../../src'
import { VersionsDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'

const pkg = require('@packages/root')

describe('VersionsDataSource', () => {
  context('.versions', () => {
    let ctx: DataContext
    let fetchStub: sinon.SinonStub
    let isDependencyInstalledByNameStub: sinon.SinonStub
    let mockNow: Date = new Date()
    let versionsDataSource: VersionsDataSource
    let currentCypressVersion: string = pkg.version

    before(() => {
      ctx = createTestDataContext('open')

      ;(ctx.lifecycleManager as any)._cachedInitialConfig = {
        component: {
          devServer: {
            framework: 'react',
            bundler: 'vite',
          },
        },
      }

      ctx.coreData.machineId = Promise.resolve('abcd123')
      ctx.coreData.currentProject = '/abc'
      ctx.coreData.currentTestingType = 'e2e'

      fetchStub = sinon.stub()
      isDependencyInstalledByNameStub = sinon.stub()
    })

    beforeEach(() => {
      sinon.stub(ctx.util, 'fetch').callsFake(fetchStub)
      sinon.stub(ctx.util, 'isDependencyInstalledByName').callsFake(isDependencyInstalledByNameStub)
      sinon.stub(os, 'platform').returns('darwin')
      sinon.stub(os, 'arch').returns('x64')
      sinon.useFakeTimers({ now: mockNow })
    })

    afterEach(() => {
      sinon.restore()
    })

    it('loads the manifest for the latest version with all headers and queries npm for release dates', async () => {
      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match({
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(true),
          'x-machine-id': 'abcd123',
          'x-testing-type': 'e2e',
          'x-logged-in': 'false',
        }),
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '15.0.0',
        }),
      })
      .withArgs(NPM_CYPRESS_REGISTRY_URL)
      .resolves({
        json: sinon.stub().resolves({
          'time': {
            modified: '2022-01-31T21:14:41.593Z',
            created: '2014-03-09T01:07:35.219Z',
            [currentCypressVersion]: '2014-03-09T01:07:37.369Z',
            '15.0.0': '2015-05-07T00:09:41.109Z',
          },
        }),
      })

      versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      expect(versionInfo).to.eql({
        current: {
          id: currentCypressVersion,
          version: currentCypressVersion,
          released: '2014-03-09T01:07:37.369Z',
        },
        latest: {
          id: '15.0.0',
          version: '15.0.0',
          released: '2015-05-07T00:09:41.109Z',
        },
      })
    })

    it('resets telemetry data triggering a new call to get the latest version', async () => {
      const currentCypressVersion = pkg.version

      ctx.coreData.machineId = Promise.resolve(null)
      ctx.coreData.currentTestingType = 'component'

      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match({
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(false),
          'x-testing-type': 'component',
          'x-logged-in': 'false',
        }),
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '16.0.0',
        }),
      })

      const privateVersionsDataSource = versionsDataSource as any

      privateVersionsDataSource.ctx.coreData.currentTestingType = 'component'

      versionsDataSource.resetLatestVersionTelemetry()

      const latestVersion = await ctx.coreData.versionData?.latestVersion

      expect(latestVersion).to.eql('16.0.0')
    })

    it('handles errors fetching version data', async () => {
      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match({
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(true),
          'x-machine-id': 'abcd123',
          'x-testing-type': 'e2e',
          'x-logged-in': 'false',
        }),
      })
      .rejects()
      .withArgs(NPM_CYPRESS_REGISTRY_URL)
      .rejects()

      versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      expect(versionInfo.current.version).to.eql(currentCypressVersion)
    })

    it('handles invalid response errors', async () => {
      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match({
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(true),
          'x-machine-id': 'abcd123',
          'x-testing-type': 'e2e',
          'x-logged-in': 'false',
        }),
      })
      .callsFake(async () => new Response('Error'))
      .withArgs(NPM_CYPRESS_REGISTRY_URL)
      .callsFake(async () => new Response('Error'))

      versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      // Reset the testing type in the class
      // @ts-ignore
      versionsDataSource._currentTestingType = null

      versionsDataSource.resetLatestVersionTelemetry()

      await ctx.coreData.versionData?.latestVersion

      expect(versionInfo.current.version).to.eql(currentCypressVersion)
    })

    it('generates x-framework, x-bundler, and x-dependencies headers', async () => {
      isDependencyInstalledByNameStub.callsFake(async (packageName) => {
        // Should include any resolved dependency with a valid version
        if (packageName === 'react') {
          return {
            dependency: packageName,
            detectedVersion: '1.2.3',
          } as Cypress.DependencyToInstall
        }

        if (packageName === 'vue') {
          return {
            dependency: packageName,
            detectedVersion: '4.5.6',
          }
        }

        if (packageName === '@builder.io/qwik') {
          return {
            dependency: packageName,
            detectedVersion: '1.1.4',
          }
        }

        if (packageName === '@playwright/experimental-ct-core') {
          return {
            dependency: packageName,
            detectedVersion: '1.33.0',
          }
        }

        // Dependency without resolved version should be excluded
        if (packageName === 'typescript') {
          return {
            dependency: packageName,
            detectedVersion: null,
          }
        }

        // Any dependencies that error while resolving should be excluded
        throw new Error('Failed check')
      })

      ctx.coreData.currentTestingType = 'component'
      versionsDataSource = new VersionsDataSource(ctx)
      ctx.coreData.currentTestingType = 'e2e'
      versionsDataSource.resetLatestVersionTelemetry()
      await versionsDataSource.versionData()

      expect(fetchStub).to.have.been.calledWith(
        CYPRESS_REMOTE_MANIFEST_URL,
        {
          headers: sinon.match({
            'x-framework': 'react',
            'x-dev-server': 'vite',
            'x-dependencies': 'react@1.2.3,vue@4.5.6,@builder.io/qwik@1.1.4,@playwright/experimental-ct-core@1.33.0',
          }),
        },
      )
    })
  })
})
