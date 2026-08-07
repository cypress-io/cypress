export const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

export type CloudEnv = keyof typeof CLOUD_URLS

export function resolveCloudEnv (env: NodeJS.ProcessEnv = process.env): CloudEnv {
  return (env.CYPRESS_INTERNAL_CLOUD_ENV ?? (env.CYPRESS_INTERNAL_ENV || 'development')) as CloudEnv
}

export const eventCollectorEnv = (): CloudEnv => {
  const env = process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV as CloudEnv

  return CLOUD_URLS[env] ? env : 'production'
}

export const eventCollectorUrl = (includeMachineId = false): string => {
  return `${CLOUD_URLS[eventCollectorEnv()]}/${includeMachineId ? 'machine-collect' : 'anon-collect'}`
}
