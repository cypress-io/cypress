export * from './baseConfig'

export * from './cliOverrides'

export * from './compatConfig'

export * from './frontendOverrides'

export * from './graphqlConfig'

export * from './jsonConfig'

export * from './nodeConfig'

export * from './typeAwareConfig'

export * from './vitestConfig'

export * from './vueTsxOverrides'

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
