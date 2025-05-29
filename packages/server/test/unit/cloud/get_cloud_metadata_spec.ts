import { sinon } from '../../spec_helper'
import { CloudDataSource } from '@packages/data-context/src/sources'
import { getCloudMetadata } from '../../../lib/cloud/get_cloud_metadata'

describe('getCloudMetadata', () => {
  let mockCloudDataSource: CloudDataSource
  let originalCypressConfigEnv: string | undefined = process.env.CYPRESS_CONFIG_ENV
  let originalCypressInternalEnv: string | undefined = process.env.CYPRESS_INTERNAL_ENV

  beforeEach(() => {
    mockCloudDataSource = {
      getCloudUrl: sinon.stub().returns('https://cloud.cypress.io'),
      additionalHeaders: sinon.stub().resolves({ 'x-cypress-cloud-header': 'test' }),
    } as unknown as CloudDataSource
  })

  afterEach(() => {
    if (originalCypressConfigEnv) {
      process.env.CYPRESS_CONFIG_ENV = originalCypressConfigEnv
    } else {
      delete process.env.CYPRESS_CONFIG_ENV
    }

    if (originalCypressInternalEnv) {
      process.env.CYPRESS_INTERNAL_ENV = originalCypressInternalEnv as 'development' | 'staging' | 'production'
    } else {
      delete process.env.CYPRESS_INTERNAL_ENV
    }
  })

  it('should return the cloud metadata based on the cypress cloud config', async () => {
    process.env.CYPRESS_CONFIG_ENV = 'staging'
    process.env.CYPRESS_INTERNAL_ENV = 'development'

    const cloudMetadata = await getCloudMetadata(mockCloudDataSource)

    expect(mockCloudDataSource.getCloudUrl).to.have.been.calledWith('staging')
    expect(mockCloudDataSource.additionalHeaders).to.have.been.called
    expect(cloudMetadata).to.deep.equal({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })

  it('should return the cloud metadata based on the cypress internal config', async () => {
    process.env.CYPRESS_INTERNAL_ENV = 'development'

    const cloudMetadata = await getCloudMetadata(mockCloudDataSource)

    expect(mockCloudDataSource.getCloudUrl).to.have.been.calledWith('development')
    expect(mockCloudDataSource.additionalHeaders).to.have.been.called
    expect(cloudMetadata).to.deep.equal({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })

  it('should return the cloud metadata based on the default environment', async () => {
    delete process.env.CYPRESS_CONFIG_ENV
    delete process.env.CYPRESS_INTERNAL_ENV

    const cloudMetadata = await getCloudMetadata(mockCloudDataSource)

    expect(mockCloudDataSource.getCloudUrl).to.have.been.calledWith('production')
    expect(mockCloudDataSource.additionalHeaders).to.have.been.called
    expect(cloudMetadata).to.deep.equal({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })
})
