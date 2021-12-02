import Debug from 'debug'
import path from 'path'

import * as settings from './util/settings'
import errors from './errors'
import { fs } from './util/fs'
import { escapeFilenameInUrl } from './util/escape_filename'
import { makeLegacyDataContext } from './makeDataContext'

const debug = Debug('cypress:server:project_utils')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const multipleForwardSlashesReplacer = (match: string) => match.replace('//', '/')
const backSlashesRe = /\\/g

const normalizeSpecUrl = (browserUrl: string, specUrl: string) => {
  if (process.env.LAUNCHPAD) {
    return browserUrl
  }

  return [
    browserUrl,
    '#/tests',
    escapeFilenameInUrl(specUrl),
  ].join('/')
  .replace(multipleForwardSlashesRe, multipleForwardSlashesReplacer)
}

const getPrefixedPathToSpec = (spec: Cypress.Spec) => {
  // strip out the integration folder and prepend with "/"
  // example:
  //
  // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
  // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
  //
  // becomes /integration/foo.js

  // To avoid having invalid urls from containing backslashes,
  // we normalize specUrls to posix by replacing backslash by slash
  // Indeed, path.realtive will return something different on windows
  // than on posix systems which can lead to problems
  const p = spec.relative.replace(backSlashesRe, '/')
  const url = `/${p}`

  debug('prefixed path for spec url %s', url)

  return url
}

export const getSpecUrl = ({
  spec,
  browserUrl,
  projectRoot,
}: {
  browserUrl?: string
  projectRoot: string
  spec: Cypress.Spec
}) => {
  browserUrl ??= ''

  // App routes to spec with convention {browserUrl}#/runner?file={relativeSpecPath}
  if (process.env.LAUNCHPAD) {
    if (!spec.absolute) {
      return browserUrl
    }

    const relativeSpecPath = path.relative(projectRoot, path.resolve(projectRoot, spec.absolute))
    .replace(backSlashesRe, '/')

    return `${browserUrl}/#/runner?file=${relativeSpecPath}`
    .replace(multipleForwardSlashesRe, multipleForwardSlashesReplacer)
  }

  debug('get spec url: %o', spec)

  // if we don't have a absoluteSpecPath or its __all
  if (!spec.absolute || spec.absolute === '__all') {
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
  const prefixedPath = getPrefixedPathToSpec(spec)
  const url = normalizeSpecUrl(browserUrl, prefixedPath)

  debug('return path to spec %o', { prefixedPath, url })

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

export async function getDefaultConfigFilePath (projectRoot: string, ctx = makeLegacyDataContext()): Promise<string | undefined> {
  return ctx.config.getDefaultConfigBasename(projectRoot)
}
