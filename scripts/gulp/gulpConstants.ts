// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CYPRESS_INTERNAL_ENV: 'staging' | 'development' | 'production'
    }
  }
}

/**
 * Gulp is only used for running the application during development.  At this point of starting the app,
 * process.env.CYPRESS_INTERNAL_ENV has not been set yet unless explicitly set on the command line. If not
 * set on the command line, it is set to 'development' [here](https://github.com/cypress-io/cypress/blob/a5ec234005fead97f6cfdf611abf8d9f4ad0565d/packages/server/lib/environment.js#L22)
 *
 * When running in a production build, a file is written out to set CYPRESS_INTERNAL_ENV to 'production'
 * [here](https://github.com/cypress-io/cypress/blob/a5ec234005fead97f6cfdf611abf8d9f4ad0565d/scripts/binary/build.ts#L176).
 * However, running in production will not use the code in this file.
 */

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
