require('@babel/register')({
  'plugins': [
    // "istanbul",
    [require.resolve('@babel/plugin-proposal-decorators'), { 'legacy': true }],
    [require.resolve('@babel/plugin-transform-class-properties'), { 'loose': true }],
  ],
  'presets': [
    require.resolve('@babel/preset-env'),
    require.resolve('@babel/preset-react'),
    [require.resolve('@babel/preset-typescript'), { allowNamespaces: true }],
  ],

  // Setting this will remove the currently hooked extensions of `.es6`, `.es`, `.jsx`, `.mjs`
  // and .js so you'll have to add them back if you want them to be used again.
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],

  ignore: [/node_modules/],
  // Setting this to false will disable the cache.
  cache: true,
  // sourceMaps: 'inline',
  // compact: true,
})
