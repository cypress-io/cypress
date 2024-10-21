const _ = require('lodash')
const path = require('path')
const cwd = require('../cwd')
const debug = require('debug')('cypress:server:controllers')
const { escapeFilenameInUrl } = require('../util/escape_filename')
const { getCtx } = require('@packages/data-context')
const { cors } = require('@packages/network')
const { privilegedCommandsManager } = require('../privileged-commands/privileged-commands-manager')

module.exports = {

  async handleIframe (req, res, config, remoteStates, extraOptions) {
    const test = req.params[0]
    const iframePath = cwd('lib', 'html', 'iframe.html')
    const specFilter = _.get(extraOptions, 'specFilter')

    debug('handle iframe %o', { test, specFilter, config })

    const specs = await this.getSpecs(test, config, extraOptions)
    const supportFileJs = this.getSupportFile(config)
    const allFilesToSend = specs

    if (supportFileJs) {
      allFilesToSend.unshift(supportFileJs)
    }

    debug('all files to send %o', _.map(allFilesToSend, 'relative'))

    const superDomain = config.injectDocumentDomain ?
      remoteStates.getPrimary().domainName :
      undefined

    const privilegedChannel = await privilegedCommandsManager.getPrivilegedChannel({
      browserFamily: req.query.browserFamily,
      isSpecBridge: false,
      namespace: config.namespace,
      scripts: allFilesToSend,
      url: req.proxiedUrl,
    })

    const iframeOptions = {
      superDomain,
      title: this.getTitle(test),
      scripts: JSON.stringify(allFilesToSend),
      privilegedChannel,
    }

    debug('iframe %s options %o', test, iframeOptions)

    res.render(iframePath, iframeOptions)
  },

  async handleCrossOriginIframe (req, res, config) {
    const iframePath = cwd('lib', 'html', 'spec-bridge-iframe.html')
    const superDomain = config.injectDocumentDomain ?
      cors.getSuperDomain(req.proxiedUrl) :
      undefined

    const origin = cors.getOrigin(req.proxiedUrl)

    const privilegedChannel = await privilegedCommandsManager.getPrivilegedChannel({
      browserFamily: req.query.browserFamily,
      isSpecBridge: true,
      namespace: config.namespace,
      scripts: [],
      url: req.proxiedUrl,
    })

    const iframeOptions = {
      superDomain,
      title: `Cypress for ${origin}`,
      namespace: config.namespace,
      privilegedChannel,
    }

    debug('cross origin iframe with options %o', iframeOptions)

    res.render(iframePath, iframeOptions)
  },

  getSpecs (spec, config, extraOptions = {}) {
    // when asking for all specs: spec = "__all"
    // otherwise it is a relative spec filename like "integration/spec.js"
    debug('get specs %o', { spec, extraOptions })

    const convertSpecPath = (spec) => {
      // get the absolute path to this spec and
      // get the browser url + cache buster
      const convertedSpec = path.join(config.projectRoot, spec)

      debug('converted %s to %s', spec, convertedSpec)

      return this.prepareForBrowser(convertedSpec, config.projectRoot, config.namespace)
    }

    const getSpecsHelper = async () => {
      // grab all of the specs if this is ci
      if (spec === '__all') {
        debug('returning all specs')

        const ctx = getCtx()

        // In case the user clicked "run all specs" and deleted a spec in the list, we will
        // only include specs we know to exist
        const existingSpecs = new Set(ctx.project.specs.map(({ relative }) => relative))
        const filteredSpecs = ctx.project.runAllSpecs.reduce((acc, relSpec) => {
          if (existingSpecs.has(relSpec)) {
            acc.push(convertSpecPath(relSpec))
          }

          return acc
        }, [])

        return filteredSpecs
      }

      debug('normalizing spec %o', { spec })

      // normalize by sending in an array of 1
      return [convertSpecPath(spec)]
    }

    return getSpecsHelper()
  },

  prepareForBrowser (filePath, projectRoot, namespace) {
    const SPEC_URL_PREFIX = `/${namespace}/tests?p`

    filePath = filePath.replace(SPEC_URL_PREFIX, '__CYPRESS_SPEC_URL_PREFIX__')
    filePath = escapeFilenameInUrl(filePath).replace('__CYPRESS_SPEC_URL_PREFIX__', SPEC_URL_PREFIX)
    const relativeFilePath = path.relative(projectRoot, filePath)

    return {
      absolute: filePath,
      relative: relativeFilePath,
      relativeUrl: this.getTestUrl(relativeFilePath, namespace),
    }
  },

  getTestUrl (file, namespace) {
    const url = `/${namespace}/tests?p=${file}`

    debug('test url for file %o', { file, url })

    return url
  },

  getTitle (test) {
    if (test === '__all') {
      return 'All Tests'
    }

    return test
  },

  getSupportFile (config) {
    const { projectRoot, supportFile, namespace } = config

    if (!supportFile) {
      return
    }

    return this.prepareForBrowser(supportFile, projectRoot, namespace)
  },
}
