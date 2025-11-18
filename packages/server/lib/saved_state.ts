import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import Bluebird from 'bluebird'
import appData from './util/app_data'
import { getCwd } from './cwd'
import { File as FileUtil } from './util/file'
import { fs } from './util/fs'
import { AllowedState, allowedKeys } from '@packages/types'
import { globalPubSub } from '@packages/data-context'
import { logError } from '@packages/stderr-filtering'

const debug = Debug('cypress:server:saved_state')

const stateFiles: Record<string, typeof FileUtil> = {}

export const formStatePath = (projectRoot?: string) => {
  return Bluebird.try(() => {
    debug('making saved state from %s', getCwd())

    if (projectRoot) {
      debug('for project path %s', projectRoot)

      return projectRoot
    }

    debug('missing project path, looking for project here')

    let cypressConfigPath = getCwd('cypress.config.js')

    return fs.pathExistsAsync(cypressConfigPath)
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressConfigPath)
        projectRoot = getCwd()

        return
      }

      cypressConfigPath = getCwd('cypress.config.ts')

      return fs.pathExistsAsync(cypressConfigPath)
    })
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressConfigPath)
        projectRoot = getCwd()
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
    logError(`WARNING: attempted to save state for non-allowed key(s): ${invalidKeys.join(', ')}. All keys must be allowed in server/lib/saved_state.ts`)
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

  // @ts-ignore - this is currently affecting the v8-snapshot type checking job as we are importing the file directly from the server package
  // After some package refactoring, we should be able to remove this.
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

    // @ts-ignore - this is currently affecting the v8-snapshot type checking job as we are importing the file directly from the server package
    // After some package refactoring, we should be able to remove this.
    stateFiles[fullStatePath] = stateFile

    return stateFile as SavedStateAPI
  })
}
