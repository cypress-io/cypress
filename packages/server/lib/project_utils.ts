import Debug from 'debug'
import path from 'path'

import errors from './errors'
import { fs } from './util/fs'
import { escapeFilenameInUrl } from './util/escape_filename'

const debug = Debug('cypress:server:project_utils')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const multipleForwardSlashesReplacer = (match: string) => match.replace('//', '/')
const backSlashesRe = /\\/g

const normalizeSpecUrl = (browserUrl: string, specUrl: string) => {
  if (process.env.LAUNCHPAD) {
    debug('returning browserUrl %s', browserUrl)

    return browserUrl
  }

  // format is: http://localhost:<port>/__/#/specs/runner?file=<relative_url>
  const escapedRelativeUrl = escapeFilenameInUrl(specUrl)
  const hash = `#/specs/runner?file=${escapedRelativeUrl}`

  const url = `${browserUrl}/${hash}`.replace(multipleForwardSlashesRe, multipleForwardSlashesReplacer)

  debug('normalized url %s', url)

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

  // App routes to spec with convention {browserUrl}#/specs/runner?file={relativeSpecPath}
  if (process.env.LAUNCHPAD) {
    if (!spec.absolute) {
      debug('no spec absolute path, returning: %s', browserUrl)

      return browserUrl
    }

    const relativeSpecPath = path.relative(projectRoot, path.resolve(projectRoot, spec.absolute))
    .replace(backSlashesRe, '/')

    const normalized = `${browserUrl}/#/specs/runner?file=${relativeSpecPath}`
    .replace(multipleForwardSlashesRe, multipleForwardSlashesReplacer)

    debug('returning spec url %s', normalized)

    return normalized
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
  const url = normalizeSpecUrl(browserUrl, spec.relative)

  debug('return path to spec %o', { url })

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
      errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, configFile)
    }
  }

  return
}
