import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import * as appData from './util/app_data'
import { getCwd } from './cwd'
import { File as FileUtil } from './util/file'
import fsExtra from 'fs-extra'
import { AllowedState, allowedKeys } from '@packages/types'
import { globalPubSub } from '@packages/data-context'
import { logError } from '@packages/stderr-filtering'

const debug = Debug('cypress:server:saved_state')

const stateFiles: Record<string, typeof FileUtil> = {}

export const formStatePath = async (projectRoot?: string) => {
  debug('making saved state from %s', getCwd())

  if (projectRoot) {
    debug('for project path %s', projectRoot)

    return path.join(appData.toHashName(projectRoot), 'state.json')
  }

  debug('missing project path, looking for project here')

  const cwd = getCwd()

  const jsConfig = getCwd('cypress.config.js')

  if (await fsExtra.pathExists(jsConfig)) {
    debug('found cypress file %s', jsConfig)
    const root = cwd

    return path.join(appData.toHashName(root), 'state.json')
  }

  const tsConfig = getCwd('cypress.config.ts')

  if (await fsExtra.pathExists(tsConfig)) {
    debug('found cypress file %s', tsConfig)
    const root = cwd

    return path.join(appData.toHashName(root), 'state.json')
  }

  debug('state path for global mode')

  return path.join('__global__', 'state.json')
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
  get: () => Promise<AllowedState>
  set: (stateToSet: AllowedState) => Promise<void>
}

export const create = (projectRoot?: string, isTextTerminal: boolean = false): Promise<SavedStateAPI> => {
  if (isTextTerminal) {
    debug('noop saved state')

    return Promise.resolve(FileUtil.noopFile)
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
