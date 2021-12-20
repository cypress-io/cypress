// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
export const DEFAULT_INTERNAL_CLOUD_ENV = process.env.CYPRESS_INTERNAL_ENV || 'staging'

export type MODES = 'dev' | 'devWatch' | 'test'

export const ENV_VARS = {
  // Building the "production" version of Cypress
  PROD: {
    CYPRESS_INTERNAL_ENV: 'production',
    CYPRESS_INTERNAL_CLOUD_ENV: 'production',
  },

  // Uses the "built" vite assets, not the served ones
  DEV_OPEN: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // staging for now, until we get an e2e workflow w/ cloud project
  },

  // Used when we're running Cypress in true "development" mode
  DEV: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // staging for now, until we get an e2e workflow w/ cloud project
  },
}
