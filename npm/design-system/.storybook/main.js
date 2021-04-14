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
