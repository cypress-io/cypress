const path = require('path')

module.exports = {
  resolve: {
    // for this example, let's point '@cypress/react' at the root
    alias: {
      '@cypress/react': path.resolve('../..'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            // we want to instrument unit tests on the fly so we usually insert this plugin
            // 'babel-plugin-istanbul',
            // but @cypress/react inserts this plugin automatically
            // if the code coverage is enabled, so you don't have to worry
          ],
        },
      },
      {
        test: /\.scss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
}
