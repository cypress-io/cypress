const path = require('path')

module.exports = {
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  webpackFinal: async (config) => {
    const sassLoader = {
      loader: 'sass-loader',
      options: {
        sassOptions: {
          // TOOD: Add absolute imports
          // includePaths: ['src/'],
          // Paths must match those in rollup.config.js
          includePaths: [path.resolve('node_modules'), path.resolve('../../node_modules')],
        },
      },
    }

    config.module.rules.push(...[
      {
        test: /\.s[ca]ss$/,
        exclude: /\.module\.s[ca]ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                compileType: 'icss',
              },
            },
          },
          sassLoader,
        ],
      },
      {
        test: /\.module\.s[ca]ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                compileType: 'module',
                localIdentName: '[name]__[local]--[hash:base64:5]',
                exportLocalsConvention: 'camelCaseOnly',
              },
            },
          },
          sassLoader,
        ],
      },
    ])

    return config
  },
}
