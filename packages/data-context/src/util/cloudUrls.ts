export const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

export type CloudEnv = keyof typeof CLOUD_URLS

export function resolveCloudEnv (env: NodeJS.ProcessEnv = process.env): CloudEnv {
  return (env.CYPRESS_INTERNAL_CLOUD_ENV ?? (env.CYPRESS_INTERNAL_ENV || 'development')) as CloudEnv
}
