const fs = require('fs')
const path = require('path')
const { specifiedRules } = require('graphql')

const graphqlOpts = {
  env: 'literal',
  tagName: 'gql',
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
  'plugins': [
    '@cypress/dev',
    'graphql',
  ],
  'extends': [
    'plugin:@cypress/dev/general',
    'plugin:@cypress/dev/tests',
  ],
  'rules': {
    'prefer-spread': 'off',
    'prefer-rest-params': 'off',
    'no-useless-constructor': 'off',
    'no-restricted-properties': [
      'error',
      {
        'object': 'process',
        'property': 'geteuid',
        'message': 'process.geteuid() will throw on Windows. Do not use it unless you catch any potential errors.',
      },
      {
        'object': 'os',
        'property': 'userInfo',
        'message': 'os.userInfo() will throw when there is not an `/etc/passwd` entry for the current user (like when running with --user 12345 in Docker). Do not use it unless you catch any potential errors.',
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
  'settings': {
    'react': {
      'version': '16.8',
    },
  },
}
