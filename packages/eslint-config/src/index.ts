export * from './baseConfig'

export * from './cliOverrides'

export * from './compatConfig'

export * from './frontendOverrides'

export * from './graphqlConfig'

export * from './jsonConfig'

export * from './mochaConfig'

export * from './nodeConfig'

export * from './reactConfig'

export * from './typeAwareConfig'

export * from './vitestConfig'

import * as globalImport from 'globals'

export const globals = {
  ...globalImport,
  specHelper: {
    sinon: 'readonly',
    expect: 'readonly',
    lib: 'readonly',
    global: false,
  },
}
