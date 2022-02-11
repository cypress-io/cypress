import { expect } from 'chai'
import { graphqlSchema } from '@packages/graphql/src/schema'
import os from 'os'
import sinon from 'sinon'
import { DataContext } from '../../../src'
import { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape } from '../../../src/actions'
import { InjectedConfigApi } from '../../../src/data'
import { ErrorApiShape } from '../../../src/DataContext'
import { BrowserApiShape, VersionsDataSource } from '../../../src/sources'

const pkg = require('@packages/root')
const nmi = require('node-machine-id')

describe('VersionsDataSource', () => {
  context('.versions', () => {
    let ctx: DataContext
    let nmiStub: sinon.SinonStub
    let fetchStub: sinon.SinonStub
    let mockNow: Date = new Date()
    let versionsDataSource: VersionsDataSource
    let currentCypressVersion: string = pkg.version

    before(() => {
      ctx = new DataContext({
        schema: graphqlSchema,
        mode: 'open',
        modeOptions: {},
        appApi: {} as AppApiShape,
        localSettingsApi: {} as LocalSettingsApiShape,
        authApi: {} as AuthApiShape,
        errorApi: {} as ErrorApiShape,
        configApi: {
          getServerPluginHandlers: () => [],
        } as InjectedConfigApi,
        projectApi: {} as ProjectApiShape,
        electronApi: {} as ElectronApiShape,
        browserApi: {} as BrowserApiShape,
      })

      ctx.coreData.currentTestingType = 'e2e'

      fetchStub = sinon.stub()
    })

    beforeEach(() => {
      nmiStub = sinon.stub(nmi, 'machineId')
      sinon.stub(ctx.util, 'fetch').get(() => fetchStub)
      sinon.stub(os, 'platform').returns('darwin')
      sinon.stub(os, 'arch').returns('x64')
      sinon.useFakeTimers({ now: mockNow })
    })

    afterEach(() => {
      sinon.restore()
    })

    it('loads the manifest for the latest version with all headers and queries npm for release dates', async () => {
      nmiStub.resolves('abcd123')

      fetchStub
      .withArgs('https://download.cypress.io/desktop.json', {
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(true),
          'x-machine-id': 'abcd123',
          'x-testing-type': 'e2e',
        },
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '15.0.0',
        }),
      })
      .withArgs('https://registry.npmjs.org/cypress')
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

    it('loads the manifest for the latest version with minimal headers and queries npm for release dates defaulting to current date', async () => {
      nmiStub.throws()

      fetchStub
      .withArgs('https://download.cypress.io/desktop.json', {
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(false),
        },
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '14.0.0',
        }),
      })

      const privateVersionsDataSource = versionsDataSource as any

      privateVersionsDataSource.ctx.coreData.currentTestingType = null
      privateVersionsDataSource._npmMetadata = Promise.resolve({
        modified: '2022-01-31T21:14:41.593Z',
        created: '2014-03-09T01:07:35.219Z',
      })

      const versionInfo = await versionsDataSource.versionData()

      expect(versionInfo).to.eql({
        current: {
          id: currentCypressVersion,
          version: currentCypressVersion,
          released: mockNow.toISOString(),
        },
        latest: {
          id: '14.0.0',
          version: '14.0.0',
          released: mockNow.toISOString(),
        },
      })
    })

    it('resets telemetry data triggering a new call to get the latest version', async () => {
      const currentCypressVersion = pkg.version

      nmiStub.throws()
      ctx.coreData.currentTestingType = 'component'

      fetchStub
      .withArgs('https://download.cypress.io/desktop.json', {
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': currentCypressVersion,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
          'x-initial-launch': String(false),
          'x-testing-type': 'component',
        },
      }).resolves({
        json: sinon.stub().resolves({
          name: 'Cypress',
          version: '16.0.0',
        }),
      })

      const privateVersionsDataSource = versionsDataSource as any

      privateVersionsDataSource.ctx.coreData.currentTestingType = 'component'

      versionsDataSource.resetLatestVersionTelemetry()

      const latestVersion = await privateVersionsDataSource._latestVersion

      expect(latestVersion).to.eql('16.0.0')
    })
  })
})
