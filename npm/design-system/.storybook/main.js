const cssFolders = require('../css.folders')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

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
          includePaths: cssFolders,
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

    config.resolve.plugins.push(new TsconfigPathsPlugin())

    return config
  },
}
