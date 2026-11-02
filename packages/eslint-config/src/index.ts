export * from './baseConfig'

export * from './cliOverrides'

export * from './frontendOverrides'

export * from './jsonConfig'

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
