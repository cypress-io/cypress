module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    // allow lazy loaded components with dynamic "import(...)"
    // https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import/
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    // https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs
    // loose ES6 modules allow us to dynamically mock imports during tests
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        loose: true,
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          'cypress-react-unit-test': './dist',
        },
      },
    ],
  ],
}
