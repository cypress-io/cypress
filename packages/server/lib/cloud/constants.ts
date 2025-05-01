export const PUBLIC_KEY_VERSION = '1'

export const CLOUD_ENV = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
