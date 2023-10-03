import cypressWebpackConfig from './cypress-webpack.config'

const port = 9999

cypressWebpackConfig.port = port
cypressWebpackConfig.env = {
  PORT_CHECK: port,
}

export default cypressWebpackConfig
