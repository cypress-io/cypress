import getenv from 'getenv'

type Maybe<T> = T | null | undefined

// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
export const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', 'staging') as 'production' | 'staging' | 'development'

process.env.CYPRESS_INTERNAL_CLOUD_ENV = CYPRESS_INTERNAL_CLOUD_ENV

process.env.CYPRESS_KONFIG_ENV = getenv('CYPRESS_KONFIG_ENV', CYPRESS_INTERNAL_CLOUD_ENV)

export const CYPRESS_INTERNAL_DEBUG_PORT_STARTUP = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_STARTUP', 7200)

export const CYPRESS_INTERNAL_DEBUG_PORT_ELECTRON = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_ELECTRON', 7201)

export const CYPRESS_INTERNAL_DEBUG_PORT_CODEGEN = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_CODEGEN', 7202)

interface GulpGlobalVals {
  debug?: Maybe<'--inspect' | '--inspect-brk'>
}

const globalVals: GulpGlobalVals = {}

export function setGulpGlobal<K extends keyof GulpGlobalVals> (k: K, v: GulpGlobalVals[K]) {
  globalVals[k] = v
}

export function getGulpGlobal<K extends keyof GulpGlobalVals> (k: K): GulpGlobalVals[K] {
  return globalVals[k]
}
