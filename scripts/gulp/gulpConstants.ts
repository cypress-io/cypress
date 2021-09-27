import getenv from 'getenv'

type Maybe<T> = T | null | undefined

// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
export const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', 'staging') as 'production' | 'staging' | 'development'

process.env.CYPRESS_INTERNAL_CLOUD_ENV = CYPRESS_INTERNAL_CLOUD_ENV

process.env.CYPRESS_KONFIG_ENV = getenv('CYPRESS_KONFIG_ENV', CYPRESS_INTERNAL_CLOUD_ENV)

export const CYPRESS_INTERNAL_E2E_TESTING_SELF = getenv.bool('CYPRESS_INTERNAL_E2E_TESTING_SELF', false)

export const CYPRESS_INTERNAL_GQL_PORT = getenv.int('CYPRESS_INTERNAL_GQL_PORT', 52159)

export const CYPRESS_INTERNAL_GQL_TEST_PORT = getenv.int('CYPRESS_INTERNAL_GQL_TEST_PORT', 52100)

export const CYPRESS_INTERNAL_VITE_APP_PORT = getenv.int('CYPRESS_INTERNAL_VITE_APP_PORT', 3333)

export const CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT = getenv.int('CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT', 3001)

interface GulpGlobalVals {
  debug?: Maybe<'--inspect' | '--inspect-brk'>
  shouldWatch?: boolean
  envVars: Partial<{
    CYPRESS_INTERNAL_DEV_DEBUG: boolean
    CYPRESS_INTERNAL_E2E_TESTING_SELF: boolean
    CYPRESS_INTERNAL_GQL_PORT: number
    CYPRESS_INTERNAL_GQL_TEST_PORT: number
    CYPRESS_INTERNAL_VITE_APP_PORT: number
    CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT: number
  }>
}

const globalVals: GulpGlobalVals = {
  shouldWatch: true,
  envVars: {
    CYPRESS_INTERNAL_DEV_DEBUG: false,
    CYPRESS_INTERNAL_GQL_PORT: 52159,
    CYPRESS_INTERNAL_GQL_TEST_PORT: 52100,
    CYPRESS_INTERNAL_VITE_APP_PORT: 3333,
    CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT: 3001,
  },
}

export function setGulpGlobal<K extends keyof GulpGlobalVals> (k: K, v: GulpGlobalVals[K]) {
  globalVals[k] = v
}

export function getGulpGlobal<K extends keyof GulpGlobalVals> (k: K): GulpGlobalVals[K] {
  return globalVals[k]
}
