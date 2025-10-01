import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import os from 'os'
import { Response } from 'cross-fetch'

import { DataContext } from '../../../src'
import { VersionsDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'
import { AllowedState, CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'
import pkg from '@packages/root'

describe('VersionsDataSource', () => {
  describe('.versions', () => {
    let ctx: DataContext
    let fetchMock: jest.Mock
    let isDependencyInstalledByNameStub: jest.Mock
    let mockNow: Date = new Date()
    let currentCypressVersion: string = pkg.version

    beforeEach(() => {
      ctx = createTestDataContext('open')

      // @ts-expect-error
      ctx.lifecycleManager._cachedInitialConfig = {
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

      fetchMock = jest.fn()

      isDependencyInstalledByNameStub = jest.fn()

      // @ts-expect-error
      jest.spyOn(ctx.util, 'fetch').mockImplementation(fetchMock)
      // @ts-expect-error
      jest.spyOn(ctx.util, 'isDependencyInstalledByName').mockImplementation(isDependencyInstalledByNameStub)
      jest.spyOn(os, 'platform').mockReturnValue('darwin')
      jest.spyOn(os, 'arch').mockReturnValue('x64')
      jest.useFakeTimers({ now: mockNow })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('loads the manifest for the latest version with all headers and queries npm for release dates', async () => {
      fetchMock.mockImplementation((url: string, options: { headers: Record<string, string> }) => {
        if (url === NPM_CYPRESS_REGISTRY_URL) {
          return Promise.resolve({
            // @ts-expect-error
            json: jest.fn().mockResolvedValue({
              'time': {
                modified: '2022-01-31T21:14:41.593Z',
                created: '2014-03-09T01:07:35.219Z',
                [currentCypressVersion]: '2014-03-09T01:07:37.369Z',
                '18.0.0': '2015-05-07T00:09:41.109Z',
              },
            }),
          })
        }

        if (
          url === CYPRESS_REMOTE_MANIFEST_URL &&
          options.headers['Content-Type'] === 'application/json' &&
          options.headers['x-cypress-version'] === currentCypressVersion &&
          options.headers['x-os-name'] === 'darwin' &&
          options.headers['x-arch'] === 'x64' &&
          options.headers['x-initial-launch'] === String(true) &&
          options.headers['x-machine-id'] === 'abcd123' &&
          options.headers['x-testing-type'] === 'e2e' &&
          options.headers['x-logged-in'] === 'false') {
          return Promise.resolve({
            // @ts-expect-error
            json: jest.fn().mockResolvedValue({
              name: 'Cypress',
              version: '18.0.0',
            }),
          })
        }

        throw new Error('not found')
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      expect(versionInfo).toEqual({
        current: {
          id: currentCypressVersion,
          version: currentCypressVersion,
          released: '2014-03-09T01:07:37.369Z',
        },
        latest: {
          id: '18.0.0',
          version: '18.0.0',
          released: '2015-05-07T00:09:41.109Z',
        },
      })
    })

    it('resets telemetry data triggering a new call to get the latest version', async () => {
      ctx.coreData.machineId = Promise.resolve(null)
      ctx.coreData.currentTestingType = 'component'

      fetchMock.mockImplementation((url: string, options: { headers: Record<string, string> }) => {
        if (url === NPM_CYPRESS_REGISTRY_URL) {
          return Promise.resolve({
            // @ts-expect-error
            json: jest.fn().mockResolvedValue({
              'time': {
                modified: '2022-01-31T21:14:41.593Z',
                created: '2014-03-09T01:07:35.219Z',
                [currentCypressVersion]: '2014-03-09T01:07:37.369Z',
                '18.0.0': '2015-05-07T00:09:41.109Z',
              },
            }),
          })
        }

        // first mocked response
        if (
          url === CYPRESS_REMOTE_MANIFEST_URL &&
          options.headers['Content-Type'] === 'application/json' &&
          options.headers['x-cypress-version'] === currentCypressVersion &&
          options.headers['x-os-name'] === 'darwin' &&
          options.headers['x-arch'] === 'x64' &&
          options.headers['x-initial-launch'] === String(true) &&
          options.headers['x-testing-type'] === 'component' &&
          options.headers['x-logged-in'] === 'false') {
          return Promise.resolve({
            // @ts-expect-error
            json: jest.fn().mockResolvedValue({
              name: 'Cypress',
              version: '15.0.0',
            }),
          })
        }

        // second mocked response
        if (
          url === CYPRESS_REMOTE_MANIFEST_URL &&
          options.headers['Content-Type'] === 'application/json' &&
          options.headers['x-cypress-version'] === currentCypressVersion &&
          options.headers['x-os-name'] === 'darwin' &&
          options.headers['x-arch'] === 'x64' &&
          options.headers['x-initial-launch'] === String(false) &&
          options.headers['x-testing-type'] === 'e2e' &&
          options.headers['x-logged-in'] === 'false' &&
          options.headers['x-initial-launch'] === String(false)) {
          return Promise.resolve({
            // @ts-expect-error
            json: jest.fn().mockResolvedValue({
              name: 'Cypress',
              version: '16.0.0',
            }),
          })
        }

        throw new Error('not found')
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      await versionsDataSource.versionData()

      expect(await ctx.coreData.versionData?.latestVersion).toEqual('15.0.0')

      ctx.coreData.currentTestingType = 'e2e'

      versionsDataSource.resetLatestVersionTelemetry()

      expect(await ctx.coreData.versionData?.latestVersion).toEqual('16.0.0')
    })

    it('handles errors fetching version data', async () => {
      fetchMock.mockImplementation((url: string, options: { headers: Record<string, string> }) => {
        if (url === NPM_CYPRESS_REGISTRY_URL) {
          return Promise.reject(new Error('NPM_CYPRESS_REGISTRY_URL mocked response failed'))
        }

        if (
          url === CYPRESS_REMOTE_MANIFEST_URL &&
          options.headers['Content-Type'] === 'application/json' &&
          options.headers['x-cypress-version'] === currentCypressVersion &&
          options.headers['x-os-name'] === 'darwin' &&
          options.headers['x-arch'] === 'x64' &&
          options.headers['x-initial-launch'] === String(true) &&
          options.headers['x-testing-type'] === 'e2e' &&
          options.headers['x-logged-in'] === 'false') {
          return Promise.reject(new Error('CYPRESS_REMOTE_MANIFEST_URL mocked response failed'))
        }

        throw new Error('not found')
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      expect(versionInfo.current.version).toEqual(currentCypressVersion)
    })

    it('handles invalid response errors', async () => {
      fetchMock.mockImplementation((url: string, options: { headers: Record<string, string> }) => {
        if (url === NPM_CYPRESS_REGISTRY_URL) {
          return Promise.reject(new Response('Error'))
        }

        if (
          url === CYPRESS_REMOTE_MANIFEST_URL &&
          options.headers['Content-Type'] === 'application/json' &&
          options.headers['x-cypress-version'] === currentCypressVersion &&
          options.headers['x-os-name'] === 'darwin' &&
          options.headers['x-arch'] === 'x64' &&
          options.headers['x-initial-launch'] === String(true) &&
          options.headers['x-machine-id'] === 'abcd123' &&
          options.headers['x-testing-type'] === 'e2e' &&
          options.headers['x-logged-in'] === 'false') {
          return Promise.reject(new Response('Error'))
        }

        throw new Error('not found')
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      const versionInfo = await versionsDataSource.versionData()

      // Reset the testing type in the class
      // @ts-ignore
      versionsDataSource._currentTestingType = null

      versionsDataSource.resetLatestVersionTelemetry()

      await ctx.coreData.versionData?.latestVersion

      expect(versionInfo.current.version).toEqual(currentCypressVersion)
    })

    it('generates x-framework, x-bundler, and x-dependencies headers', async () => {
      isDependencyInstalledByNameStub.mockImplementation(async (packageName) => {
        // Should include any resolved dependency with a valid version
        if (packageName === 'react') {
          return {
            dependency: packageName,
            detectedVersion: '1.2.3',
          } as unknown as Cypress.DependencyToInstall
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

      expect(fetchMock).toHaveBeenCalledWith(
        CYPRESS_REMOTE_MANIFEST_URL,
        {
          headers: expect.objectContaining({
            'x-framework': 'react',
            'x-dev-server': 'vite',
            'x-dependencies': 'react@1.2.3,vue@4.5.6,@builder.io/qwik@1.1.4,@playwright/experimental-ct-core@1.33.0',
          }),
        },
      )
    })

    it('generates x-notifications header', async () => {
      (ctx.config.localSettingsApi.getPreferences as jest.Mock<typeof ctx.config.localSettingsApi.getPreferences>).mockImplementation(() => {
        return Promise.resolve({
          notifyWhenRunCompletes: ['errored'],
          notifyWhenRunStarts: true,
          notifyWhenRunStartsFailing: true,
        }as unknown as AllowedState)
      })

      const versionsDataSource = new VersionsDataSource(ctx)

      await versionsDataSource.versionData()

      expect(fetchMock).toHaveBeenCalledWith(
        CYPRESS_REMOTE_MANIFEST_URL,
        {
          headers: expect.objectContaining({
            'x-notifications': 'errored,started,failing',
          }),
        },
      )
    })
  })
})
