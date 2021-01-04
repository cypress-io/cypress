import { EventEmitter } from 'events'
import path from 'path'

const { escapeFilenameInUrl } = require('./util/escape_filename')

interface GetSpecUrl {
  absoluteSpecPath: string
  specType: string
  integrationFolder: string
  componentFolder: string
  projectRoot: string
  browserUrl: string
}

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

export class BaseProject extends EventEmitter {
  normalizeSpecUrl (browserUrl, specUrl) {
    const replacer = (match) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escapeFilenameInUrl(specUrl),
    ].join('/').replace(multipleForwardSlashesRe, replacer)
  }

  getPrefixedPathToSpec (options: GetSpecUrl) {
    // for now hard code the 'type' as integration
    // but in the future accept something different here

    // strip out the integration folder and prepend with "/"
    // example:
    //
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
    //
    // becomes /integration/foo.js

    const folderToUse = options.specType === 'integration'
      ? options.integrationFolder
      : options.componentFolder

    const url = `/${path.join(options.specType, path.relative(
      folderToUse,
      path.resolve(options.projectRoot, options.absoluteSpecPath),
    ))}`

    // debug('prefixed path for spec %o', { absoluteSpecPath, specType, url })

    return url
  }

  getSpecUrl (options: GetSpecUrl) {
    // debug('get spec url: %s for spec type %s', options.absoluteSpecPath, options.specType)

    // if we don't have a absoluteSpecPath or its __all
    if (!options.absoluteSpecPath || (options.absoluteSpecPath === '__all')) {
      const url = this.normalizeSpecUrl(options.browserUrl, '/__all')

      // debug('returning url to run all specs: %s', url)

      return url
    }

    // TODO:
    // to handle both unit + integration tests we need
    // to figure out (based on the config) where this absoluteSpecPath
    // lives. does it live in the integrationFolder or
    // the unit folder?
    // once we determine that we can then prefix it correctly
    // with either integration or unit
    const prefixedPath = this.getPrefixedPathToSpec(options)
    const url = this.normalizeSpecUrl(options.browserUrl, prefixedPath)

    // debug('return path to spec %o', options.specType, options.absoluteSpecPath, prefixedPath, url)

    return url
  }
}
