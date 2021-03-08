module.exports = {
  'presets': ['@babel/preset-env', '@babel/preset-react'],
  'plugins': ['@babel/plugin-proposal-class-properties'],
  // place plugins for Cypress tests into "test" environment
  // so that production bundle is not instrumented
  env: {
    'test': {
      'plugins': [
        // during Cypress tests we want to instrument source code
        // to get code coverage from tests
        'babel-plugin-istanbul',
        // we also want to export ES6 modules as objects
        // to allow mocking named imports
        [
          '@babel/plugin-transform-modules-commonjs',
          {
            'loose': true,
          },
        ],
      ],
    },
  },
}
