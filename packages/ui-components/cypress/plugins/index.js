const wp = require('@cypress/webpack-preprocessor')
const webpackOptions = {
  mode: 'none',
  resolve: {
    extensions: ['.ts', '.js', '.jsx', '.tsx', '.png'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js|jsx|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [
              [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
              [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
            ],
            presets: [
              require.resolve('@babel/preset-env'),
              require.resolve('@babel/preset-react'),
              require.resolve('@babel/preset-typescript'),
            ],
            babelrc: false,
          },
        },
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: require.resolve('file-loader'),
            options: {
              name: './fonts/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(png)$/,
        use: [
          {
            loader: require.resolve('file-loader'),
            options: {
              name: './img/[name].[ext]',
              esModule: false,
            },
          },
        ],
      },
    ],
  },
}

module.exports = (on) => {
  on('file:preprocessor', wp({ webpackOptions }))
}
