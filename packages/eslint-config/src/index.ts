export * from './baseConfig'

export * from './cliOverrides'

export * from './graphqlConfig'

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
