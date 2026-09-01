const fs = require('fs')
const path = require('path')
const { specifiedRules } = require('graphql')

const graphqlOpts = {
  env: 'literal',
  tagName: 'gql',
  // eslint-disable-next-line no-restricted-syntax
  schemaString: fs.readFileSync(
    path.join(__dirname, 'packages/data-context/schemas/schema.graphql'),
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
    // owned by the cloud-delivered `cy-prompt` and `studio` bundles and copied
    // into the app, so lint findings here cannot be fixed in this repo
    'packages/app/src/prompt/prompt-app-types.ts',
    'packages/app/src/studio/studio-app-types.ts',
    // ignore as the file has invalid syntax
    'system-tests/projects/no-specs-babel-conflict/src/Invalid.jsx',
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
    {
      files: [
        'packages/**/lib/**/*.{js,ts,tsx}',
        'packages/**/src/**/*.{js,ts,tsx}',
        'packages/server/**/*.{js,ts,tsx}',
      ],
      excludedFiles: [
        '**/test/**',
        '**/*.spec.*',
        '**/cypress/**',
        '**/__snapshots__/**',
      ],
      rules: {
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      },
    },
    {
      // `consistent-type-imports` needs parser services, so it throws on the
      // files `@babel/eslint-parser` handles. It only fires on TypeScript anyway.
      files: ['*.ts', '*.tsx', '*.vue'],
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', {
          prefer: 'type-imports',
          // inline `{ type X }` specifiers break v8 snapshot bundling
          fixStyle: 'separate-type-imports',
          // inline `import()` type annotations are erased on emit regardless
          disallowTypeAnnotations: false,
        }],
      },
    },
    {
      // Sample user apps compiled by their own toolchains. Angular resolves a
      // constructor parameter's type to a DI token at runtime, so a type-only
      // import erases the token and the app fails to compile (NG2003).
      files: [
        'system-tests/project-fixtures/**',
        'system-tests/projects/**',
      ],
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
    {
      // `eslint-plugin-graphql` pays its per-file cost on every linted file, not
      // just the ones holding a `gql` template, and that cost dominates lint time.
      // Scope it to the packages that actually use `gql` — add a package here if
      // it starts using it.
      files: [
        'packages/{app,frontend-shared,launchpad,data-context}/**/*.{js,jsx,ts,tsx,vue}',
      ],
      plugins: [
        'graphql',
      ],
      rules: {
        'graphql/capitalized-type-name': ['warn', graphqlOpts],
        'graphql/no-deprecated-fields': ['error', graphqlOpts],
        'graphql/template-strings': ['error', { ...graphqlOpts, validators }],
        'graphql/required-fields': [
          'error',
          { ...graphqlOpts, requiredFields: ['id'] },
        ],
      },
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
  },
  settings: {
    react: {
      version: '16.8',
    },
  },
}
