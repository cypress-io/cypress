type Maybe<T> = T | null | undefined

// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
export const DEFAULT_INTERNAL_CLOUD_ENV = 'staging'

export type MODES = 'dev' | 'devWatch' | 'test'

export const ENV_VARS = {
  // Building the "production" version of Cypress
  PROD: {
    CYPRESS_INTERNAL_ENV: 'production',
    CYPRESS_INTERNAL_CLOUD_ENV: 'production',
    CYPRESS_INTERNAL_GQL_PORT: `52200`,
  },

  // Used when we're spawning Cypress as the E2E target for the
  // test runner. We build the assets w/ GQL_TEST_PORT into `dist-e2e`,
  // and spawn the server against
  E2E_TEST_TARGET: {
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // staging for now, until we get an e2e workflow w/ cloud project
    CYPRESS_INTERNAL_GQL_PORT: `52300`,
    CYPRESS_INTERNAL_ENV: 'staging', // Different than DEV, which will default to "development". TODO: Make this do less things internall
    XVFB_DISPLAY_NUM: `44`,
  },

  // Uses the "built" vite assets, not the served ones
  DEV_OPEN: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // staging for now, until we get an e2e workflow w/ cloud project
    CYPRESS_INTERNAL_GQL_PORT: `52200`,
  },

  // Used when we're running Cypress in true "development" mode
  DEV: {
    CYPRESS_KONFIG_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // TODO: Change this / remove konfig
    CYPRESS_INTERNAL_CLOUD_ENV: DEFAULT_INTERNAL_CLOUD_ENV, // staging for now, until we get an e2e workflow w/ cloud project
    CYPRESS_INTERNAL_GQL_PORT: `52200`,
    CYPRESS_INTERNAL_VITE_APP_PORT: `3333`,
    CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT: `3001`,
  },
}

interface GulpGlobalVals {
  debug?: Maybe<'--inspect' | '--inspect-brk'>
  shouldWatch?: boolean
}

const globalVals: GulpGlobalVals = {
  shouldWatch: true,
}

export function setGulpGlobal<K extends keyof GulpGlobalVals> (k: K, v: GulpGlobalVals[K]) {
  globalVals[k] = v
}

export function getGulpGlobal<K extends keyof GulpGlobalVals> (k: K): GulpGlobalVals[K] {
  return globalVals[k]
}
