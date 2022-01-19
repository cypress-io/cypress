const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const cwd = require('../cwd')
const glob = require('../util/glob')
const specsUtil = require('../util/specs')
const pathHelpers = require('../util/path_helpers')
const debug = require('debug')('cypress:server:controllers')
const { escapeFilenameInUrl } = require('../util/escape_filename')

const SPEC_URL_PREFIX = '/__cypress/tests?p'

module.exports = {
  handleFiles (req, res, config) {
    debug('handle files')

    return specsUtil.default.findSpecs(config)
    .then((files) => {
      return res.json({
        integration: files,
      })
    })
  },

  handleIframe (req, res, config, getRemoteState, extraOptions) {
    const test = req.params[0]
    const iframePath = cwd('lib', 'html', 'iframe.html')
    const specFilter = _.get(extraOptions, 'specFilter')

    debug('handle iframe %o', { test, specFilter })

    return this.getSpecs(test, config, extraOptions)
    .then((specs) => {
      return this.getSupportFile(config)
      .then((js) => {
        const allFilesToSend = js.concat(specs)

        debug('all files to send %o', _.map(allFilesToSend, 'relative'))

        const iframeOptions = {
          title: this.getTitle(test),
          domain: getRemoteState().domainName,
          scripts: JSON.stringify(allFilesToSend),
        }

        debug('iframe %s options %o', test, iframeOptions)

        return res.render(iframePath, iframeOptions)
      })
    })
  },

  getSpecs (spec, config, extraOptions = {}) {
    // when asking for all specs: spec = "__all"
    // otherwise it is a relative spec filename like "integration/spec.js"
    debug('get specs %o', { spec, extraOptions })

    const convertSpecPath = (spec) => {
      // get the absolute path to this spec and
      // get the browser url + cache buster
      const convertedSpec = pathHelpers.getAbsolutePathToSpec(spec, config)

      debug('converted %s to %s', spec, convertedSpec)

      return this.prepareForBrowser(convertedSpec, config.projectRoot)
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

    const getSpecsHelper = () => {
      // grab all of the specs if this is ci
      const componentTestingEnabled = _.get(config, 'resolved.testingType.value', 'e2e') === 'component'

      if (spec === '__all') {
        debug('returning all specs')

        return specsUtil.default.findSpecs(config)
        .then((specs) => {
          debug('found __all specs %o', specs)

          return specs
        })
        .filter(specFilterFn)
        .filter((foundSpec) => {
          return componentTestingEnabled
            ? foundSpec.specType === 'component'
            : foundSpec.specType === 'integration'
        }).then((specs) => {
          debug('filtered __all specs %o', specs)

          return specs
        }).map((spec) => {
          // grab the name of each
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

  getSupportFile (config) {
    const { projectRoot, supportFile } = config

    let files = []

    if (supportFile !== false) {
      files = [supportFile]
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
