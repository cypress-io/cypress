import Debug from 'debug'
import path from 'path'

import * as settings from './util/settings'
import errors from './errors'
import { fs } from './util/fs'
import { escapeFilenameInUrl } from './util/escape_filename'
import { CYPRESS_CONFIG_FILES } from './configFiles'

const debug = Debug('cypress:server:project_utils')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const backSlashesRe = /\\/g

const normalizeSpecUrl = (browserUrl: string, specUrl: string) => {
  const replacer = (match: string) => match.replace('//', '/')

  return [
    browserUrl,
    '#/tests',
    escapeFilenameInUrl(specUrl),
  ].join('/')
  .replace(multipleForwardSlashesRe, replacer)
}

const getPrefixedPathToSpec = ({
  integrationFolder,
  componentFolder,
  projectRoot,
  type,
  pathToSpec,
}: {
  integrationFolder: string
  componentFolder: string
  projectRoot: string
  type: string
  pathToSpec: string
}) => {
  type ??= 'integration'

  // for now hard code the 'type' as integration
  // but in the future accept something different here

  // strip out the integration folder and prepend with "/"
  // example:
  //
  // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
  // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
  //
  // becomes /integration/foo.js

  const folderToUse = type === 'integration' ? integrationFolder : componentFolder

  // To avoid having invalid urls from containing backslashes,
  // we normalize specUrls to posix by replacing backslash by slash
  // Indeed, path.realtive will return something different on windows
  // than on posix systems which can lead to problems
  const url = `/${path.join(type, path.relative(
    folderToUse,
    path.resolve(projectRoot, pathToSpec),
  )).replace(backSlashesRe, '/')}`

  debug('prefixed path for spec %o', { pathToSpec, type, url })

  return url
}

export const getSpecUrl = ({
  absoluteSpecPath,
  specType,
  browserUrl,
  integrationFolder,
  componentFolder,
  projectRoot,
}: {
  absoluteSpecPath?: string
  browserUrl?: string
  integrationFolder: string
  componentFolder: string
  projectRoot: string
  specType?: 'integration' | 'component'
}) => {
  specType ??= 'integration'
  browserUrl ??= ''

  debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

  // if we don't have a absoluteSpecPath or its __all
  if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
    const url = normalizeSpecUrl(browserUrl, '/__all')

    debug('returning url to run all specs: %s', url)

    return url
  }

  // TODO:
  // to handle both unit + integration tests we need
  // to figure out (based on the config) where this absoluteSpecPath
  // lives. does it live in the integrationFolder or
  // the unit folder?
  // once we determine that we can then prefix it correctly
  // with either integration or unit
  const prefixedPath = getPrefixedPathToSpec({
    integrationFolder,
    componentFolder,
    projectRoot,
    pathToSpec: absoluteSpecPath,
    type: specType,
  })
  const url = normalizeSpecUrl(browserUrl, prefixedPath)

  debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

  return url
}

export const checkSupportFile = async ({
  supportFile,
  configFile,
}: {
  supportFile?: string | boolean
  configFile?: string | false
}) => {
  if (supportFile && typeof supportFile === 'string') {
    const found = await fs.pathExists(supportFile)

    if (!found) {
      errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, settings.configFile({ configFile }))
    }
  }

  return
}

export async function getDefaultConfigFilePath (projectRoot: string, returnDefaultValueIfNotFound: boolean = true): Promise<string | undefined> {
  const filesInProjectDir = await fs.readdir(projectRoot)

  const foundConfigFiles = CYPRESS_CONFIG_FILES.filter((file) => filesInProjectDir.includes(file))

  // if we only found one default file, it is the one
  if (foundConfigFiles.length === 1) {
    return foundConfigFiles[0]
  }

  // if we found more than one, throw a language conflict
  if (foundConfigFiles.length > 1) {
    throw errors.throw('CONFIG_FILES_LANGUAGE_CONFLICT', projectRoot, ...foundConfigFiles)
  }

  if (returnDefaultValueIfNotFound) {
    // Default is to create a new `cypress.json` file if one does not exist.
    return CYPRESS_CONFIG_FILES[0]
  }

  throw errors.get('NO_DEFAULT_CONFIG_FILE_FOUND', projectRoot)
}
