import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import Bluebird from 'bluebird'
import appData from './util/app_data'
import cwd from './cwd'
import FileUtil from './util/file'
import { fs } from './util/fs'
import { AllowedState, allowedKeys } from '@packages/types'
import { globalPubSub } from '@packages/data-context'

const debug = Debug('cypress:server:saved_state')

const stateFiles: Record<string, typeof FileUtil> = {}

export const formStatePath = (projectRoot?: string) => {
  return Bluebird.try(() => {
    debug('making saved state from %s', cwd())

    if (projectRoot) {
      debug('for project path %s', projectRoot)

      return projectRoot
    }

    debug('missing project path, looking for project here')

    let cypressConfigPath = cwd('cypress.config.js')

    return fs.pathExistsAsync(cypressConfigPath)
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressConfigPath)
        projectRoot = cwd()

        return
      }

      cypressConfigPath = cwd('cypress.config.ts')

      return fs.pathExistsAsync(cypressConfigPath)
    })
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressConfigPath)
        projectRoot = cwd()
      }

      return projectRoot
    })
  }).then((projectRoot) => {
    const fileName = 'state.json'

    if (projectRoot) {
      debug(`state path for project ${projectRoot}`)

      return path.join(appData.toHashName(projectRoot), fileName)
    }

    debug('state path for global mode')

    return path.join('__global__', fileName)
  })
}

const normalizeAndAllowSet = (set, key, value) => {
  const valueObject = (() => {
    if (_.isString(key)) {
      const tmp = {}

      tmp[key] = value

      return tmp
    }

    return key
  })()

  const invalidKeys = _.filter(_.keys(valueObject), (key) => {
    return !_.includes(allowedKeys, key)
  })

  if (invalidKeys.length) {
    // eslint-disable-next-line no-console
    console.error(`WARNING: attempted to save state for non-allowed key(s): ${invalidKeys.join(', ')}. All keys must be allowed in server/lib/saved_state.ts`)
  }

  return set(_.pick(valueObject, allowedKeys))
}

interface SavedStateAPI {
  get: () => Bluebird<AllowedState>
  set: (stateToSet: AllowedState) => Bluebird<void>
}

export const create = (projectRoot?: string, isTextTerminal: boolean = false): Bluebird<SavedStateAPI> => {
  if (isTextTerminal) {
    debug('noop saved state')

    return Bluebird.resolve(FileUtil.noopFile)
  }

  return formStatePath(projectRoot)
  .then((statePath: string) => {
    const fullStatePath = appData.projectsPath(statePath)

    debug('full state path %s', fullStatePath)
    if (stateFiles[fullStatePath]) {
      return stateFiles[fullStatePath]
    }

    debug('making new state file around %s', fullStatePath)
    const stateFile = new FileUtil({
      path: fullStatePath,
    })

    globalPubSub.on('test:cleanup', () => {
      stateFile.__resetForTest()
    })

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndAllowSet)

    stateFiles[fullStatePath] = stateFile

    return stateFile as SavedStateAPI
  })
}
