import type { CloudDataSource } from '@packages/data-context/src/sources'

export const getCloudMetadata = async (cloudDataSource: CloudDataSource) => {
  const cloudEnv = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
  const cloudUrl = cloudDataSource.getCloudUrl(cloudEnv)
  const cloudHeaders = await cloudDataSource.additionalHeaders()

  return {
    cloudUrl,
    cloudHeaders,
  }
}
