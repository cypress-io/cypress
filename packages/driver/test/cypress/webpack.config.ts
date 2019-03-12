import * as webpack from 'webpack'


const config:webpack.Configuration =  {
  resolve: {
    extensions: ['.ts', '.js', '.coffee'],
  },

  module: {
    rules: [
			{
				test: /\.coffee/,
				exclude: [/node_modules/],
				use: {
					loader: require.resolve('coffee-loader')
				}
			},
      {
        test: /\.(ts|js)$/,
        exclude: [/node_modules/],
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            // plugins: [
            //   "istanbul"
            // ],
            presets: ['@babel/preset-typescript'],
            babelrc: false,
          }
        },
      },
    ],
  },
}

module.exports = config