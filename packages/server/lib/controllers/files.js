const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const cwd = require('../cwd')
const debug = require('debug')('cypress:server:controllers')
const { escapeFilenameInUrl } = require('../util/escape_filename')
const { getCtx } = require('@packages/data-context')
const { cors } = require('@packages/network')

module.exports = {

  handleIframe (req, res, config, remoteStates, extraOptions) {
    const test = req.params[0]
    const iframePath = cwd('lib', 'html', 'iframe.html')
    const specFilter = _.get(extraOptions, 'specFilter')

    debug('handle iframe %o', { test, specFilter })

    return this.getSpecs(test, config, extraOptions)
    .then((specs) => {
      const supportFileJs = this.getSupportFile(config)
      const allFilesToSend = specs

      if (supportFileJs) {
        allFilesToSend.unshift(supportFileJs)
      }

      debug('all files to send %o', _.map(allFilesToSend, 'relative'))

      const iframeOptions = {
        title: this.getTitle(test),
        domain: remoteStates.getPrimary().domainName,
        scripts: JSON.stringify(allFilesToSend),
      }

      debug('iframe %s options %o', test, iframeOptions)

      return res.render(iframePath, iframeOptions)
    })
  },

  handleCrossOriginIframe (req, res) {
    const iframePath = cwd('lib', 'html', 'spec-bridge-iframe.html')
    const domain = cors.getSuperDomain(req.proxiedUrl)

    const iframeOptions = {
      domain,
      title: `Cypress for ${domain}`,
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

    const specFilter = _.get(extraOptions, 'specFilter')

    debug('specFilter %o', { specFilter })
    const specFilterContains = (spec) => {
      // only makes sense if there is specFilter string
      // the filter should match the logic in
      // desktop-gui/src/specs/specs-store.js
      return spec.relative.toLowerCase().includes(specFilter.toLowerCase())
    }
    const specFilterFn = specFilter ? specFilterContains : () => true

    const getSpecsHelper = async () => {
      // grab all of the specs if this is ci
      if (spec === '__all') {
        debug('returning all specs')

        const ctx = getCtx()

        const [e2ePatterns, componentPatterns] = await Promise.all([
          ctx.project.specPatternsForTestingType(ctx.project.projectRoot, 'e2e'),
          ctx.project.specPatternsForTestingType(ctx.project.projectRoot, 'component'),
        ])

        // It's possible that the E2E pattern matches some component tests, for example
        // e2e.specPattern: src/**/*.cy.ts
        // component.specPattern: src/components/**/*.cy.ts
        // in this case, we want to remove anything that matches
        // - the component.specPattern
        // - the e2e.excludeSpecPattern
        return ctx.project.findSpecs({
          projectRoot: config.projectRoot,
          testingType: 'e2e',
          specPattern: e2ePatterns.specPattern,
          configSpecPattern: e2ePatterns.specPattern,
          excludeSpecPattern: e2ePatterns.excludeSpecPattern,
          additionalIgnorePattern: componentPatterns.specPattern,
        })
        .then((specs) => {
          debug('found __all specs %o', specs)

          return specs
        })
        .filter(specFilterFn)
        .then((specs) => {
          debug('filtered __all specs %o', specs)

          return specs
        }).map(convertSpecPath)
      }

      debug('normalizing spec %o', { spec })

      // normalize by sending in an array of 1
      return [convertSpecPath(spec)]
    }

    return Promise
    .try(() => {
      return getSpecsHelper()
    })
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
