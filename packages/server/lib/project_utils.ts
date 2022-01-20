import Debug from 'debug'
import path from 'path'

import errors from './errors'
import { fs } from './util/fs'
import { escapeFilenameInUrl } from './util/escape_filename'

const debug = Debug('cypress:server:project_utils')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const multipleForwardSlashesReplacer = (match: string) => match.replace('//', '/')
const backSlashesRe = /\\/g

// format is: http://localhost:<port>/__/#/specs/runner?file=<relative_url>
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
  if (!spec.absolute) {
    debug('no spec absolute path, returning: %s', browserUrl)

    return browserUrl
  }

  const relativeSpecPath = path.relative(projectRoot, path.resolve(projectRoot, spec.relative))
  .replace(backSlashesRe, '/')

  const escapedRelativePath = escapeFilenameInUrl(relativeSpecPath)

  const normalized = `${browserUrl}/#/specs/runner?file=${escapedRelativePath}`
  .replace(multipleForwardSlashesRe, multipleForwardSlashesReplacer)

  debug('returning spec url %s', normalized)

  return normalized
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
