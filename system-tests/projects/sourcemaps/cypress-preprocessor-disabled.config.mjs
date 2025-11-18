import webpack from '@cypress/webpack-preprocessor'

export default (on, config) => {
  const options = {
    webpackOptions: {
      devtool: false, // This disables sourcemaps
      resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                },
              },
            ],
          },
        ],
      },
    },
    watchOptions: {},
  }

  on('file:preprocessor', webpack(options))
}
