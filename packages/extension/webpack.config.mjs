import path from 'path'
import webpack from 'webpack'

export default {
  mode: process.env.NODE_ENV || 'development',
  entry: './app/v2/init.ts',
  // https://github.com/cypress-io/cypress/issues/15032
  // Default webpack output setting is "eval".
  // Chrome doesn't allow "eval" inside extensions.
  devtool: 'inline-cheap-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(import.meta.dirname, 'tsconfig.app.v2.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'background.js',
    path: path.resolve(import.meta.dirname, 'app-dist', 'v2'),
  },
  plugins: [
    new webpack.DefinePlugin({
      // The @packages/extension needs access to the process.env.NODE_DEBUG variable.
      // Since it's one variable, it makes most sense to just use the
      // DefinePlugin to push the value into the bundle instead of providing the whole process
      'process.env.NODE_DEBUG': JSON.stringify('process.env.NODE_DEBUG'),
    }),
  ],
}
