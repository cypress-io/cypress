/* eslint-disable
    brace-style,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const R = require('ramda')
const path = require('path')
const Promise = require('bluebird')
const cwd = require('../cwd')
const glob = require('../util/glob')
const specsUtil = require('../util/specs')
const pathHelpers = require('../util/path_helpers')
const CacheBuster = require('../util/cache_buster')
const debug = require('debug')('cypress:server:controllers')
const { escapeFilenameInUrl } = require('../util/escape_filename')

const SPEC_URL_PREFIX = '/__cypress/tests?p'

module.exports = {
  handleFiles (req, res, config) {
    debug('handle files')

    return specsUtil.find(config)
    .then((files) => {
      return res.json({
        integration: files,
      })
    })
  },

  handleIframe (req, res, config, getRemoteState) {
    const test = req.params[0]
    const iframePath = cwd('lib', 'html', 'iframe.html')

    debug('handle iframe %o', { test })

    return this.getSpecs(test, config)
    .then((specs) => {
      return this.getJavascripts(config)
      .then((js) => {
        const iframeOptions = {
          title: this.getTitle(test),
          domain: getRemoteState().domainName,
          scripts: JSON.stringify(js.concat(specs)),
        }

        debug('iframe %s options %o', test, iframeOptions)

        return res.render(iframePath, iframeOptions)
      })
    })
  },

  getSpecs (spec, config) {
    debug('get specs %o', { spec })

    const convertSpecPath = (spec) => {
      // get the absolute path to this spec and
      // get the browser url + cache buster
      const convertedSpec = pathHelpers.getAbsolutePathToSpec(spec, config)

      debug('converted %s to %s', spec, convertedSpec)

      return this.prepareForBrowser(convertedSpec, config.projectRoot)
    }

    const getSpecsHelper = () => {
      // grab all of the specs if this is ci
      const experimentalComponentTestingEnabled = _.get(config, 'resolved.experimentalComponentTesting.value', false)

      if (spec === '__all') {
        return specsUtil.find(config)
        .then(R.tap((specs) => {
          return debug('found __all specs %o', specs)
        })).filter((spec) => {
          if (experimentalComponentTestingEnabled) {
            return spec.specType === 'integration'
          }

          return true
        }).then(R.tap((specs) => {
          return debug('filtered __all specs %o', specs)
        })).map((spec) => // grab the name of each
        {
          return spec.absolute
        }).map(convertSpecPath)
      }

      // normalize by sending in an array of 1
      return [convertSpecPath(spec)]
    }

    return Promise
    .try(() => {
      return getSpecsHelper()
    })
  },

  prepareForBrowser (filePath, projectRoot) {
    filePath = filePath.replace(SPEC_URL_PREFIX, '__CYPRESS_SPEC_URL_PREFIX__')
    filePath = escapeFilenameInUrl(filePath).replace('__CYPRESS_SPEC_URL_PREFIX__', SPEC_URL_PREFIX)
    const relativeFilePath = path.relative(projectRoot, filePath)

    return {
      absolute: filePath,
      relative: relativeFilePath,
      relativeUrl: this.getTestUrl(relativeFilePath),
    }
  },

  getTestUrl (file) {
    const url = `${SPEC_URL_PREFIX}=${file}`

    debug('test url for file %o', { file, url })

    return url
  },

  getTitle (test) {
    if (test === '__all') {
      return 'All Tests'
    }

    return test
  },

  getJavascripts (config) {
    const { projectRoot, supportFile, javascripts } = config

    // automatically add in support scripts and any javascripts
    let files = [].concat(javascripts)

    if (supportFile !== false) {
      files = [supportFile].concat(files)
    }

    // TODO: there shouldn't be any reason
    // why we need to re-map these. its due
    // to the javascripts array but that should
    // probably be mapped during the config
    const paths = _.map(files, (file) => {
      return path.resolve(projectRoot, file)
    })

    return Promise
    .map(paths, (p) => {
      // is the path a glob?
      if (!glob.hasMagic(p)) {
        return p
      }

      // handle both relative + absolute paths
      // by simply resolving the path from projectRoot
      p = path.resolve(projectRoot, p)

      return glob(p, { nodir: true })
    }).then(_.flatten)
    .map((filePath) => {
      return this.prepareForBrowser(filePath, projectRoot)
    })
  },

}
