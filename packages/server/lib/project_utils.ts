import Debug from 'debug'
import path from 'path'

import settings from './util/settings'
import errors from './errors'
import { fs } from './util/fs'
import { escapeFilenameInUrl } from './util/escape_filename'

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
  configFile?: string | boolean
}) => {
  if (supportFile && typeof supportFile === 'string') {
    const found = await fs.pathExists(supportFile)

    if (!found) {
      const configFileRelativePath = settings.configFile({ configFile })

      errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, configFileRelativePath)
    }
  }

  return
}
