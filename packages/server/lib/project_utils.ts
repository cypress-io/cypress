import Debug from 'debug'
import path from 'path'
import { escapeFilenameInUrl } from './util/escape_filename'

const debug = Debug('cypress:server:project_utils')

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

  const escapedRelativePath = escapeFilenameInUrl(relativeSpecPath)

  const specUrl = `${browserUrl}#/specs/runner?file=${escapedRelativePath}`

  debug('returning spec url %s', specUrl)

  return specUrl
}
