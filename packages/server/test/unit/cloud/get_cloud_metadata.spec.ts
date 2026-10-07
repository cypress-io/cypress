import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import { getCloudMetadata } from '../../../lib/cloud/get_cloud_metadata'

describe('getCloudMetadata', () => {
  let mockCloudDataSource: CloudDataSource
  let originalCypressConfigEnv: string | undefined = process.env.CYPRESS_CONFIG_ENV
  let originalCypressInternalEnv: string | undefined = process.env.CYPRESS_INTERNAL_ENV

  beforeEach(() => {
    mockCloudDataSource = {
      getCloudUrl: vi.fn(() => 'https://cloud.cypress.io'),
      additionalHeaders: vi.fn(async () => ({ 'x-cypress-cloud-header': 'test' })),
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

    expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('staging')
    expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
    expect(cloudMetadata).toEqual({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })

  it('should return the cloud metadata based on the cypress internal config', async () => {
    process.env.CYPRESS_INTERNAL_ENV = 'development'

    const cloudMetadata = await getCloudMetadata(mockCloudDataSource)

    expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('development')
    expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
    expect(cloudMetadata).toEqual({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })

  it('should return the cloud metadata based on the default environment', async () => {
    delete process.env.CYPRESS_CONFIG_ENV
    delete process.env.CYPRESS_INTERNAL_ENV

    const cloudMetadata = await getCloudMetadata(mockCloudDataSource)

    expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('production')
    expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
    expect(cloudMetadata).toEqual({
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: { 'x-cypress-cloud-header': 'test' },
    })
  })
})
