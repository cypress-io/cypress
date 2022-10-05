// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CYPRESS_INTERNAL_ENV: 'staging' | 'development' | 'production'
    }
  }
}

export const DEFAULT_INTERNAL_CLOUD_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'

export const DEFAULT_INTERNAL_EVENT_COLLECTOR_ENV = process.env.CYPRESS_INTERNAL_ENV || 'staging'

export type MODES = 'dev' | 'devWatch' | 'test'

export const ENV_VARS = {
  // Building the "production" version of Cypress
  PROD: {
    CYPRESS_INTERNAL_ENV: 'production',
    CYPRESS_INTERNAL_CLOUD_ENV: 'production',
    CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: 'production',
  },

  // Uses the "built" vite assets, not the served ones
  DEV_OPEN: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV,
    CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: DEFAULT_INTERNAL_EVENT_COLLECTOR_ENV,
  },

  // Used when we're running Cypress in true "development" mode
  DEV: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV,
    CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: DEFAULT_INTERNAL_EVENT_COLLECTOR_ENV,
  },
}
