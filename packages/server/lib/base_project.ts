import { EventEmitter } from 'events'
import Debug from 'debug'
import Bluebird from 'bluebird'
import path from 'path'
import { escapeFilenameInUrl } from './util/escape_filename'

const debug = Debug('cypress:server:project')

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

interface GetSpecUrl {
  absoluteSpecPath: string
  specType: 'component' | 'integration'
  integrationFolder: string
  componentFolder: string
  projectRoot: string
  browserUrl: string
}

interface GetPrefixedPathToSpec {
  integrationFolder: string
  componentFolder: string
  projectRoot: string
  pathToSpec: string
  type: 'component' | 'integration'
}

export class BaseProject extends EventEmitter {
  getPrefixedPathToSpec ({
    integrationFolder, 
    componentFolder, 
    projectRoot,
    type,
    pathToSpec
  }: GetPrefixedPathToSpec) {

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

    const url = `/${path.join(type, path.relative(
      folderToUse,
      path.resolve(projectRoot, pathToSpec),
    ))}`

    debug('prefixed path for spec %o', { pathToSpec, type, url })

    return url
  }

  normalizeSpecUrl (browserUrl: string, specUrl: string) {
    const replacer = (match: string) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escapeFilenameInUrl(specUrl),
    ].join('/').replace(multipleForwardSlashesRe, replacer)
  }

  getAutomation = () => {
    return {
      use: () => console.log('TODO: Implement automation')
    }
  }

  getSpecUrl ({ absoluteSpecPath, specType, browserUrl, componentFolder, integrationFolder } : GetSpecUrl) {
    debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

    // if we don't have a absoluteSpecPath or its __all
    if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
      const url = this.normalizeSpecUrl(browserUrl, '/__all')

      debug('returning url to run all specs: %s', url)

      return Bluebird.resolve(url)
    }

    // TODO:
    // to handle both unit + integration tests we need
    // to figure out (based on the config) where this absoluteSpecPath
    // lives. does it live in the integrationFolder or
    // the unit folder?
    // once we determine that we can then prefix it correctly
    // with either integration or unit
    // const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath, specType)
    const prefixedPath = this.getPrefixedPathToSpec({
      pathToSpec: absoluteSpecPath,
      type: specType,
      integrationFolder,
      componentFolder,
      projectRoot: '/',
    })
    const url = this.normalizeSpecUrl(browserUrl, prefixedPath)

    debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

    return Bluebird.resolve(url)
  }
}