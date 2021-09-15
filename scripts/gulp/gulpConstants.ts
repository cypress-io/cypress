import getenv from 'getenv'

// Where to fetch the remote "federated" schema TODO: add w/ stitching PR
// export const CYPRESS_CLOUD_ENV = 'production'

export const CYPRESS_DEBUG_PORT_STARTUP = getenv.int('CYPRESS_DEBUG_PORT_STARTUP', 7200)

export const CYPRESS_DEBUG_PORT_ELECTRON = getenv.int('CYPRESS_DEBUG_PORT_ELECTRON', 7201)

export const CYPRESS_DEBUG_PORT_CODEGEN = getenv.int('CYPRESS_DEBUG_PORT_CODEGEN', 7202)
