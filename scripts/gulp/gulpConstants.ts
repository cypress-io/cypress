import getenv from 'getenv'

// Where to fetch the remote "federated" schema. If you have a long-running branch
// against a development schema, it's probably easiest to set this manually to "develop"
export const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', 'production') as 'production' | 'staging' | 'development'

export const CYPRESS_INTERNAL_DEBUG_PORT_STARTUP = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_STARTUP', 7200)

export const CYPRESS_INTERNAL_DEBUG_PORT_ELECTRON = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_ELECTRON', 7201)

export const CYPRESS_INTERNAL_DEBUG_PORT_CODEGEN = getenv.int('CYPRESS_INTERNAL_DEBUG_PORT_CODEGEN', 7202)
