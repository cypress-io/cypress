import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import * as appData from './util/app_data'
import { File as FileUtil } from './util/file'
import type { AllowedState } from '@packages/types'
import { allowedKeys } from '@packages/types'
import { globalPubSub } from '@packages/data-context'
import { logError } from '@packages/stderr-filtering'

const debug = Debug('cypress:server:saved_state')

const stateFiles: Record<string, FileUtil> = {}

// With no `projectRoot`, state goes to `__global__/state.json`. Callers leave it
// out on purpose for state that isn't tied to one project, such as
// `getSavedState({ type: 'global' })` and `localSettingsApi` preferences.
// Don't guess a project by looking for a config file: neither `process.cwd()`
// nor `getCwd()` (Cypress's own server folder) is the user's project.
export const formStatePath = async (projectRoot?: string) => {
  if (projectRoot) {
    debug('making saved state for project path %s', projectRoot)

    return path.join(appData.toHashName(projectRoot), 'state.json')
  }

  debug('making saved state for global mode')

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
