import webpack from '@cypress/webpack-preprocessor'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default (on, config) => {
  const options = {
    webpackOptions: {
      context: path.resolve(__dirname, 'cypress'),
      devtool: 'inline-source-map', // This disables sourcemaps
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
