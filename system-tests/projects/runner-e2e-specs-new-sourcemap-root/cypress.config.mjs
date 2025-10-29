import wp from '@cypress/webpack-preprocessor'
import path from 'node:path'
import { defineConfig } from 'cypress'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  numTestsKeptInMemory: 0,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      const options = {
        webpackOptions: {
          context: path.resolve(__dirname, 'cypress'),
          mode: 'development',
          devtool: 'inline-source-map', // preserve source maps for debugging
          resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
          },
          module: {
            rules: [
              {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-env', { targets: { node: 'current' } }],
                      '@babel/preset-typescript',
                      '@babel/preset-react', // optional if using React JSX
                    ],
                  },
                },
              },
            ],
          },
        },
      }

      on('file:preprocessor', wp(options))

      return config
    },
  },
})
