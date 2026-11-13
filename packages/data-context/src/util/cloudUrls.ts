import { resolveDevelopmentCloudWorkspaceUrl } from '@packages/config'

export const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

export type CloudEnv = keyof typeof CLOUD_URLS

/** Resolves the Cloud URL for the selected environment, applying the development workspace offset. */
export function resolveCloudUrl (environment: CloudEnv, env: NodeJS.ProcessEnv = process.env): string {
  return resolveDevelopmentCloudWorkspaceUrl(CLOUD_URLS[environment], environment, env)
}

export function resolveCloudEnv (env: NodeJS.ProcessEnv = process.env): CloudEnv {
  return (env.CYPRESS_INTERNAL_CLOUD_ENV ?? (env.CYPRESS_INTERNAL_ENV || 'development')) as CloudEnv
}
