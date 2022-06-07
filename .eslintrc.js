const fs = require('fs')
const path = require('path')
const { specifiedRules } = require('graphql')

const graphqlOpts = {
  env: 'literal',
  tagName: 'gql',
  // eslint-disable-next-line no-restricted-properties
  schemaString: fs.readFileSync(
    path.join(__dirname, 'packages/graphql/schemas/schema.graphql'),
    'utf8',
  ),
}

const validators = specifiedRules
.map((rule) => rule.name)
.filter(
  (ruleName) => {
    return [
      'NoUnusedFragmentsRule',
      'KnownFragmentNamesRule',
      'NoUnusedVariablesRule',
    ].findIndex((x) => x === ruleName) === -1
  },
)

const syncFsKeys = Object.keys(fs).filter((k) => k.endsWith('Sync') && k !== 'existsSync')

module.exports = {
  plugins: [
    '@cypress/dev',
    'graphql',
  ],
  extends: [
    'plugin:@cypress/dev/general',
    'plugin:@cypress/dev/tests',
  ],
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      files: ['**/scripts/**', '**/test/**', '**/system-tests/**'],
      rules: {
        'no-restricted-properties': 'off',
      },
    },
  ],
  rules: {
    'no-duplicate-imports': 'off',
    'import/no-duplicates': 'off',
    '@typescript-eslint/no-duplicate-imports': [
      'error',
    ],
    'prefer-spread': 'off',
    'prefer-rest-params': 'off',
    'no-useless-constructor': 'off',
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'geteuid',
        message: 'process.geteuid() will throw on Windows. Do not use it unless you catch any potential errors.',
      },
      {
        object: 'os',
        property: 'userInfo',
        message: 'os.userInfo() will throw when there is not an `/etc/passwd` entry for the current user (like when running with --user 12345 in Docker). Do not use it unless you catch any potential errors.',
      },
      ...syncFsKeys.map((property) => {
        return {
          object: 'fs',
          property,
          message: `Synchronous fs calls should not be used in Cypress. Use a Promise-based API instead.`,
        }
      }),
      ...syncFsKeys.map((property) => {
        return {
          object: 'this.ctx.fs',
          property,
          message: `Synchronous fs calls should not be used in Cypress. Use a Promise-based API instead.`,
        }
      }),
    ],
    'graphql/capitalized-type-name': ['warn', graphqlOpts],
    'graphql/no-deprecated-fields': ['error', graphqlOpts],
    'graphql/template-strings': ['error', { ...graphqlOpts, validators }],
    'graphql/required-fields': [
      'error',
      { ...graphqlOpts, requiredFields: ['id'] },
    ],
  },
  settings: {
    react: {
      version: '16.8',
    },
  },
}
