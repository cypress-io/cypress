import webpack, { Configuration, optimize, ResolvePlugin } from 'webpack'
import _ from 'lodash'
import path from 'path'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import sassGlobImporter = require('node-sass-globbing')
import HtmlWebpackPlugin = require('html-webpack-plugin')
import CopyWebpackPlugin = require('copy-webpack-plugin')
import MiniCSSExtractWebpackPlugin = require('mini-css-extract-plugin')
import LiveReloadPlugin from 'webpack-livereload-plugin'

const mode = process.env.NODE_ENV as ('development' | 'production' | 'test' | 'reporter') || 'development'
const webpackmode = mode === 'production' ? mode : 'development'

const config: webpack.Configuration = {
	mode: webpackmode,
	node: {
		fs: 'empty',
		child_process: 'empty',
		net: 'empty',
		tls: 'empty',
		module: 'empty'
	},
	resolve: {
		extensions: ['.ts', '.js', '.jsx', '.tsx', '.coffee', '.scss', '.json'],
	},

	// Enable source maps
	// 'eval' maps lines to their files, but output is compiled.
	// this gives good stack traces and devTools DX
	// also suitable for production since users will have better stack traces
	// and files will be mapped like: `cypress://../driver/cy/commands/click.coffee`
	devtool: 'eval',

	stats: {
		errors: true,
		warningsFilter: /node_modules\/mocha\/lib\/mocha.js/,
		warnings: true,
		all: false,
		builtAt: true,
		colors: true,
		modules: true,
		maxModules: 20,
		excludeModules: /main.scss/,
		timings: true,
	},

	module: {
		rules: [
			{
				test: /\.coffee/,
				exclude: /node_modules/,
				use: {
					loader: require.resolve('coffee-loader'),
				},
			},
			{
				test: /\.(ts|js|jsx|tsx)$/,
				exclude: /node_modules/,
				use: {
					loader: require.resolve('babel-loader'),
					options: {
						plugins: [
							// "istanbul",
							[require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
							[require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
						],
						presets: [
							require.resolve('@babel/preset-env'),
							require.resolve('@babel/preset-react'),
							require.resolve('@babel/preset-typescript')
						],
						babelrc: false,
					},
				},
			},
			{
				test: /\.s?css$/,
				exclude: /node_modules/,
				use: [
					{ loader: MiniCSSExtractWebpackPlugin.loader },
					{
						loader: require.resolve('css-loader'),
						options: {
							// sourceMap: true,
							modules: false,
						},
					}, // translates CSS into CommonJS
					{
						loader: require.resolve('resolve-url-loader')
					},
					{
						loader: require.resolve('sass-loader'),
						options: {
							sourceMap: true,
							importer: function (...args) {
								args[0] = args[0].replace(/\\/g, '/')
								args[1] = args[1].replace(/\\/g, '/')
								return sassGlobImporter.apply(this, args)
							},
						},
					}, // compiles Sass to CSS, using Node Sass by default
				],
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
						},
					},
				],
			},
		],
	},

	plugins: [

		new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
		new MiniCSSExtractWebpackPlugin(),
		new LiveReloadPlugin({ appendScriptTag: 'true', port: 0, }),
	],

}

export default config

export { HtmlWebpackPlugin, CopyWebpackPlugin }

