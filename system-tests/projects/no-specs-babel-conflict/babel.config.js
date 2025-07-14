// This config is taken from the cypress-services project.
// It is used to test that the Create from Component functionality works correctly
// even when a project has a conflicting babel configuration file.
// The babel config in this test project includes TypeScript preset and transform plugins
// that interfere with react-docgen parsing without passing `configFile: false` to the babel parser.
const merge = require('babel-merge')
const rootConfig = {
  plugins: [
    '@babel/plugin-transform-logical-assignment-operators',
    '@babel/plugin-transform-export-namespace-from',
    ['@babel/proposal-class-properties', { loose: true }],
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-optional-chaining',
    'babel-plugin-add-react-displayname',
  ],
  presets: [
    [
      '@babel/env',
      {
        corejs: {
          version: 3,
        },
        useBuiltIns: 'usage',
        modules: false,
        loose: true,
      },
    ],
    '@babel/react',
    '@babel/typescript',
  ],
}

const makeNycConfig = require('../../../makeNycConfig')

const plugins = [
  'optimize-clsx',
  '@babel/plugin-transform-export-namespace-from',
  ['@babel/proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-private-methods',
  [
    'prismjs',
    {
      languages: ['javascript', 'yml', 'diff'],
      plugins: [
        'line-numbers',
        'normalize-whitespace',
        'diff-highlight',
        'line-highlight',
      ],
      theme: 'default',
      css: true,
    },
  ],
]

// TODO apply it with babel's env
// only instrument the frontend code during tests
// should we insert instrumentation only for the dashboard project?
if (
  process.env.SERVER_ENV === 'test' ||
  (process.env.SERVER_ENV === 'development' && process.env.CI) ||
  process.env.CYPRESS_CT_COVERAGE ||
  process.env.FORCE_COVERAGE
) {
  plugins.push(['babel-plugin-istanbul', makeNycConfig('dashboard')])
}

if (process.env.CYPRESS) {
  plugins.push('@babel/plugin-transform-modules-commonjs')
}

// ! inject proposal-decorators *before*
module.exports = merge(
  {
    plugins,
  },
  rootConfig,
)
