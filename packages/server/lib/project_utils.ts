import { escapeFilenameInUrl } from './util/escape_filename'
import path from 'path'
import settings from './util/settings'

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const backSlashesRe = /\\/g

export const normalizeSpecUrl = (browserUrl: string, specUrl: string) => {
  const replacer = (match: string) => match.replace('//', '/')

  return [
    browserUrl,
    '#/tests',
    escapeFilenameInUrl(specUrl),
  ].join('/')
  .replace(multipleForwardSlashesRe, replacer)
}

export const getPrefixedPathToSpec =  ({
  integrationFolder, 
  componentFolder, 
  projectRoot, 
  pathToSpec, 
  type 
} : {
  integrationFolder: string, 
  componentFolder: string, 
  projectRoot: string, 
  pathToSpec: string, 
  type: string 
})  => {
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
  console.log(type, folderToUse, projectRoot, pathToSpec)

  // To avoid having invalid urls from containing backslashes,
  // we normalize specUrls to posix by replacing backslash by slash
  // Indeed, path.realtive will return something different on windows
  // than on posix systems which can lead to problems
  const url = `/${path.join(type, path.relative(
    folderToUse,
    path.resolve(projectRoot, pathToSpec),
  )).replace(backSlashesRe, '/')}`

  return url
}

/**
 * see if a config file exists for a given project
 * and it is it writable.
 */
export const ensureExists = async (projectRoot: string, configFile: string): Promise<boolean> => {
  // is there a configFile? is the root writable?
  return settings.exists(path, { configFile })
}