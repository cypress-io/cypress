const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  resolve: {
    extensions: ['.mjs', '.ts', '.svelte', '.js'],
  },
  module: {
    rules: [
      // The following two loader entries are only needed if you use Svelte 5+ with TypeScript.
      // Also make sure your tsconfig.json includes `"target": "ESNext"` in order to not downlevel syntax
      {
        test: /\.svelte\.ts$/,
        use: ['svelte-loader', 'ts-loader'],
      },
      // This is the config for other .ts files - the regex makes sure to not process .svelte.ts files twice
      {
        test: /(?<!\.svelte)\.ts$/,
        loader: 'ts-loader',
      },
      {
        // Svelte 5+:
        test: /\.(svelte|svelte\.js)$/,
        // Svelte 3 or 4:
        // test: /\.svelte$/,
        // In case you write Svelte in HTML (not recommended since Svelte 3):
        // test: /\.(html|svelte)$/,
        use: 'svelte-loader',
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devtool: 'source-map',
}
