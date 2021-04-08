// TODO: Storybook is currently not listed as a dependency of the project due to build issues in the monorepo
// "@storybook/addon-actions": "^6.1.21",
// "@storybook/addon-essentials": "^6.1.21",
// "@storybook/addon-links": "^6.1.21",
// "@storybook/preset-typescript": "^3.0.0",
// "@storybook/react": "^6.1.21",
module.exports = {
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/preset-typescript',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  webpackFinal: async (config) => {
    // TOOD: Add absolute imports
    // const sassLoader = {
    //   loader: 'sass-loader',
    //   options: {
    //     sassOptions: {
    //       includePaths: ['src/'],
    //     },
    //   },
    // }

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
          'sass-loader',
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
          'sass-loader',
        ],
      },
    ])

    return config
  },
}
