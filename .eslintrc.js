const fs = require('fs')
const path = require('path')
const { specifiedRules } = require('graphql')

const graphqlOpts = {
  env: 'literal',
  tagName: 'gql',
  // eslint-disable-next-line no-restricted-syntax
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

module.exports = {
  root: true,
  plugins: [
    '@cypress/dev',
    'graphql',
  ],
  extends: [
    'plugin:@cypress/dev/general',
    'plugin:@cypress/dev/tests',
  ],
  parser: '@typescript-eslint/parser',
  ignorePatterns: [
    // cli types are checked by dtslint
    'cli/types/**',
    // these fixtures are supposed to fail linting
    'npm/eslint-plugin-dev/test/fixtures/**',
    // Cloud generated
    'system-tests/lib/validations/**',
  ],
  overrides: [
    {
      files: [
        // ignore in tests and scripts
        '**/scripts/**',
        '**/test/**',
        '**/system-tests/**',
        'tooling/**',
        'packages/{app,driver,frontend-shared,launchpad}/cypress/**',
        '*.test.ts',
      ],
      rules: {
        'no-restricted-properties': 'off',
        'no-restricted-syntax': 'off',
      },
    },
    {
      files: ['*.json'],
      extends: 'plugin:@cypress/dev/general',
    },
  ],
  rules: {
    'no-duplicate-imports': 'off',
    'import/no-duplicates': 'error',
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
    ],
    'no-restricted-syntax': [
      // esquery tool: https://estools.github.io/esquery/
      'error',
      {
        // match sync FS methods except for `existsSync`
        // examples: fse.readFileSync, fs.readFileSync, this.ctx.fs.readFileSync...
        selector: `MemberExpression[object.name='fs'][property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']), MemberExpression[property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']):has(MemberExpression[property.name='fs'])`,
        message: 'Synchronous fs calls should not be used in Cypress. Use an async API instead.',
      },
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
