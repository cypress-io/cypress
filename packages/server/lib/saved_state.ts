import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import Bluebird from 'bluebird'
import appData from './util/app_data'
import cwd from './cwd'
import FileUtil from './util/file'
import { fs } from './util/fs'

const debug = Debug('cypress:server:saved_state')

const stateFiles: Record<string, typeof FileUtil> = {}

// TODO: remove `showedOnBoardingModal` from this list - it is only included so that misleading `allowed` are not thrown
// now that it has been removed from use
const allowed = [
  'appWidth',
  'appHeight',
  'appX',
  'appY',
  'autoScrollingEnabled',
  'browserWidth',
  'browserHeight',
  'browserX',
  'browserY',
  'isAppDevToolsOpen',
  'isBrowserDevToolsOpen',
  'reporterWidth',
  'specListWidth',
  'showedNewProjectBanner',
  'firstOpenedCypress',
  'showedStudioModal',
  'preferredOpener',
  'ctReporterWidth',
  'ctIsSpecsListOpen',
  'ctSpecListWidth',
  'firstOpened',
  'lastOpened',
  'promptsShown',
  'watchForSpecChange',
  'useDarkSidebar',
  'preferredEditorBinary',
] as const

export const formStatePath = (projectRoot) => {
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
    return !_.includes(allowed, key)
  })

  if (invalidKeys.length) {
    // eslint-disable-next-line no-console
    console.error(`WARNING: attempted to save state for non-allowed key(s): ${invalidKeys.join(', ')}. All keys must be allowed in server/lib/saved_state.js`)
  }

  return set(_.pick(valueObject, allowed))
}

interface AllowedState {
  appWidth: any
  appHeight: any
  appX: any
  appY: any
  autoScrollingEnabled: any
  browserWidth: any
  browserHeight: any
  browserX: any
  browserY: any
  isAppDevToolsOpen: any
  isBrowserDevToolsOpen: any
  reporterWidth: any
  specListWidth: any
  showedNewProjectBanner: any
  firstOpenedCypress: any
  showedStudioModal: any
  preferredOpener: any
  ctReporterWidth: any
  ctIsSpecsListOpen: any
  ctSpecListWidth: any
  firstOpened: any
  lastOpened: any
  promptsShown: any
  watchForSpecChange: any
  useDarkSidebar: any
  preferredEditorBinary: any
}

interface SavedStateAPI {
  get: () => Bluebird<Partial<AllowedState>>
  set: (stateToSet: Partial<AllowedState>) => Bluebird<void>
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

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndAllowSet)

    stateFiles[fullStatePath] = stateFile

    return stateFile as SavedStateAPI
  })
}
