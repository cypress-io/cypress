
import commonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

const config: typeof commonConfig = {
	...commonConfig,
	entry: {
		app: [path.resolve(__dirname, 'src/main')],
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
	},
}

config.plugins = [
	...config.plugins!,
	new HtmlWebpackPlugin({
		template: path.resolve(__dirname, './src/index.html'),
		env: process.env.NODE_ENV,
		inject: false,
	}),
]

config.resolve = {
	...config.resolve,
}


export default config
