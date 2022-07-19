module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-angular',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        loose: true,
      },
    ],
    [
      'module-resolver',
      {
        aliass: {
          '@cypress/angular': './dist/index.js',
        },
      },
    ],
  ],
}
