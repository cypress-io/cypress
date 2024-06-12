import chai, { expect } from 'chai'
import os from 'os'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Response } from 'cross-fetch'

import { DataContext } from '../../../src'
import { VersionsDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'

const pkg = require('@packages/root')

chai.use(sinonChai)

describe('VersionsDataSource', () => {
  context('.versions', () => {
    let ctx: DataContext
    let fetchStub: sinon.SinonStub
    let isDependencyInstalledByNameStub: sinon.SinonStub
    let mockNow: Date = new Date()
    let currentCypressVersion: string = pkg.version

    beforeEach(() => {
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

      fetchStub
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

      isDependencyInstalledByNameStub = sinon.stub()

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

      const versionsDataSource = new VersionsDataSource(ctx)

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
      ctx.coreData.machineId = Promise.resolve(null)
      ctx.coreData.currentTestingType = 'component'

      const mockRequest = {
        'Content-Type': 'application/json',
        'x-cypress-version': currentCypressVersion,
        'x-os-name': 'darwin',
        'x-arch': 'x64',
        'x-initial-launch': String(true),
        'x-testing-type': 'component',
        'x-logged-in': 'false',
      }

      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match(mockRequest),
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '15.0.0',
        }),
      })

      const mockRequest2 = {
        ...mockRequest,
        'x-initial-launch': String(false),
        'x-testing-type': 'e2e',
      }

      fetchStub
      .withArgs(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: sinon.match(mockRequest2),
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '16.0.0',
        }),
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      await versionsDataSource.versionData()

      expect(await ctx.coreData.versionData?.latestVersion).to.eql('15.0.0')

      ctx.coreData.currentTestingType = 'e2e'

      versionsDataSource.resetLatestVersionTelemetry()

      expect(await ctx.coreData.versionData?.latestVersion).to.eql('16.0.0')
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

      const versionsDataSource = new VersionsDataSource(ctx)

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

      const versionsDataSource = new VersionsDataSource(ctx)

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
      const versionsDataSource = new VersionsDataSource(ctx)

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

    it('generates x-notifications header', async () => {
      (ctx.config.localSettingsApi.getPreferences as sinon.SinonStub).callsFake(() => {
        return {
          notifyWhenRunCompletes: ['errored'],
          notifyWhenRunStarts: true,
          notifyWhenRunStartsFailing: true,
        }
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      await versionsDataSource.versionData()

      expect(fetchStub).to.have.been.calledWith(
        CYPRESS_REMOTE_MANIFEST_URL,
        {
          headers: sinon.match({
            'x-notifications': 'errored,started,failing',
          }),
        },
      )
    })
  })
})
