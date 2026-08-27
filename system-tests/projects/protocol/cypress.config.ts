import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'pid123',
  e2e: {
    supportFile: false,
    setupNodeEvents: (on, config) => {},
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: {
        module: {
          rules: [
            {
              test: /\.(js|jsx|ts|tsx)$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                    '@babel/preset-typescript',
                  ],
                },
              },
            },
            {
              test: /\.css$/i,
              use: ['style-loader', 'css-loader'],
            },
          ],
        },
      },
    },
  },
})
