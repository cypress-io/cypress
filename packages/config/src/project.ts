import Debug from 'debug'
import { mergeDefaults } from '@packages/server/lib/config'

const debug = Debug('cypress:config:project')

export function setupFullConfigWithDefaults (obj: Record<string, any> = {}) {
  debug('setting config object %o', obj)
  let { projectRoot, projectName, config, envFile, options, cliConfig } = obj

  // just force config to be an object so we dont have to do as much
  // work in our tests
  if (config == null) {
    config = {}
  }

  debug('config is %o', config)

  // flatten the object's properties into the master config object
  config.envFile = envFile
  config.projectRoot = projectRoot
  config.projectName = projectName

  return mergeDefaults(config, options, cliConfig)
}
