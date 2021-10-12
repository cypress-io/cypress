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
