const path = require('path')

module.exports = ({ mode } = { mode: 'production' }) => {
  return {
    mode,
    // so we don't get variable module output when comparing snapshots in system-tests
    stats: 'errors-only',
    // stats: 'normal', // if debugging JIT
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      alias: {
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: ['@babel/plugin-syntax-jsx'],
            },
          },
        },
      ],
    },
  }
}
