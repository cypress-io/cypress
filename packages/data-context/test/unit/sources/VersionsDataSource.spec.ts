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

    beforeEach(() => {
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

      nmiStub = sinon.stub(nmi, 'machineId')
      sinon.stub(os, 'platform').resolves('darwin')
      sinon.stub(os, 'arch').resolves('x64')
      sinon.useFakeTimers({ now: mockNow })

      fetchStub = sinon.stub()
      sinon.stub(ctx.util, 'fetch').get(() => fetchStub)
    })

    afterEach(() => {
      sinon.restore()
    })

    it('loads the manifest for the latest version with all headers and queries npm for release dates', async () => {
      const currentCypressVersion = pkg.version

      nmiStub.resolves('abcd123')
      ctx.coreData.currentTestingType = 'e2e'

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

      const versionInfo = await new VersionsDataSource(ctx).versions()

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
      const currentCypressVersion = pkg.version

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
          version: '15.0.0',
        }),
      })

      VersionsDataSource.npmMetadata = {
        modified: '2022-01-31T21:14:41.593Z',
        created: '2014-03-09T01:07:35.219Z',
      }

      const versionInfo = await new VersionsDataSource(ctx).versions()

      expect(versionInfo).to.eql({
        current: {
          id: currentCypressVersion,
          version: currentCypressVersion,
          released: mockNow.toISOString(),
        },
        latest: {
          id: '15.0.0',
          version: '15.0.0',
          released: mockNow.toISOString(),
        },
      })
    })
  })
})
