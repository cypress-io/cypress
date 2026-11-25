import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  // The rewriter's regexes run on every proxied script, so changes to them
  // are reviewed on their own against the rewriter's specs
  ...regexpConfig.map((block) => {
    return { ...block, ignores: ['lib/http/util/regex-rewriter.ts', 'lib/http/util/rewriter.ts'] }
  }),
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  noFloatingPromisesConfig(['lib/**/*.ts']),
  // The CommonJS entry point runs in Node
  {
    files: ['index.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['lib/**/*.js'],
  },
]
