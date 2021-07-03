import Debug from 'debug'
import path from 'path'

import { escapeFilenameInUrl } from './util/escape_filename'

const debug = Debug('cypress:server:project_utils')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const backSlashesRe = /\\/g

export const normalizeSpecUrl = (browserUrl: string, specUrl: string) => {
  const replacer = (match) => match.replace('//', '/')

  return [
    browserUrl,
    '#/tests',
    escapeFilenameInUrl(specUrl),
  ].join('/')
  .replace(multipleForwardSlashesRe, replacer)
}

export const getPrefixedPathToSpec = ({
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
