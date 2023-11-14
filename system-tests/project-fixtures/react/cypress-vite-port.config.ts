import viteConfig from './cypress-vite.config'

const port = 9999

viteConfig.port = port
viteConfig.env = {
  PORT_CHECK: port,
}

export default viteConfig
