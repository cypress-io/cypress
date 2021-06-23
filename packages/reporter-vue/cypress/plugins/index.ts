import { startDevServer } from '@cypress/vite-dev-server'
// import {config} from '../../vite.config'

export default (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({ options })
  })
  return config
}