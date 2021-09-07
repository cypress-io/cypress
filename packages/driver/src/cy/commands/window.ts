const _ = require('lodash')
const Promise = require('bluebird')

const $errUtils = require('../../cypress/error_utils')

const viewports = {
  'macbook-16': '1536x960',
  'macbook-15': '1440x900',
  'macbook-13': '1280x800',
  'macbook-11': '1366x768',
  'ipad-2': '768x1024',
  'ipad-mini': '768x1024',
  'iphone-xr': '414x896',
  'iphone-x': '375x812',
  'iphone-6+': '414x736',
  'iphone-se2': '375x667',
  'iphone-8': '375x667',
  'iphone-7': '375x667',
  'iphone-6': '375x667',
  'iphone-5': '320x568',
  'iphone-4': '320x480',
  'iphone-3': '320x480',
  'samsung-s10': '360x760',
  'samsung-note9': '414x846',
}

const validOrientations = ['landscape', 'portrait']

// NOTE: this is outside the function because its 'global' state to the
// cypress application and not local to the specific run. the last
// viewport set is always the 'current' viewport as opposed to the
// config. there was a bug where re-running tests without a hard
// refresh would cause viewport to hang
let currentViewport = null

module.exports = (Commands, Cypress, cy, state) => {
  const defaultViewport = _.pick(Cypress.config(), 'viewportWidth', 'viewportHeight')

  // currentViewport could already be set due to previous runs
  currentViewport = currentViewport || defaultViewport

  Cypress.on('test:before:run:async', () => {
    // if we have viewportDefaults it means
    // something has changed the default and we
    // need to restore prior to running the next test
    // after which we simply null and wait for the
    // next viewport change
    const configDefaultViewport = _.pick(Cypress.config(), 'viewportWidth', 'viewportHeight')

    setViewportAndSynchronize(configDefaultViewport.viewportWidth, configDefaultViewport.viewportHeight)
  })

  const setViewportAndSynchronize = (width, height) => {
    const viewport = { viewportWidth: width, viewportHeight: height }

    // store viewport on the state for logs
    state(viewport)

    return new Promise((resolve) => {
      if (currentViewport.viewportWidth === width && currentViewport.viewportHeight === height) {
        // noop if viewport won't change
        return resolve(currentViewport)
      }

      currentViewport = {
        viewportWidth: width,
        viewportHeight: height,
      }

      // force our UI to change to the viewport and wait for it
      // to be updated
      return Cypress.action('cy:viewport:changed', viewport, () => {
        return resolve(viewport)
      })
    })
  }

  Commands.addAll({
    title (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const resolveTitle = () => {
        const doc = state('document')

        const title = (doc && doc.title) || ''

        return cy.verifyUpcomingAssertions(title, options, {
          onRetry: resolveTitle,
        })
      }

      return resolveTitle()
    },

    window (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const getWindow = () => {
        const window = state('window')

        if (!window) {
          $errUtils.throwErrByPath('window.iframe_undefined', { onFail: options._log })
        }

        return window
      }

      // wrap retrying into its own
      // separate function
      const retryWindow = () => {
        return Promise
        .try(getWindow)
        .catch((err) => {
          options.error = err

          return cy.retry(retryWindow, options)
        })
      }

      const verifyAssertions = () => {
        return Promise.try(retryWindow).then((win) => {
          return cy.verifyUpcomingAssertions(win, options, {
            onRetry: verifyAssertions,
          })
        })
      }

      return verifyAssertions()
    },

    document (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const getDocument = () => {
        const win = state('window')

        // TODO: add failing test around logging twice
        if (!win?.document) {
          $errUtils.throwErrByPath('window.iframe_doc_undefined')
        }

        return win.document
      }

      // wrap retrying into its own
      // separate function
      const retryDocument = () => {
        return Promise
        .try(getDocument)
        .catch((err) => {
          options.error = err

          return cy.retry(retryDocument, options)
        })
      }

      const verifyAssertions = () => {
        return Promise.try(retryDocument).then((doc) => {
          return cy.verifyUpcomingAssertions(doc, options, {
            onRetry: verifyAssertions,
          })
        })
      }

      return verifyAssertions()
    },

    viewport (presetOrWidth, heightOrOrientation, options = {}) {
      const userOptions = options

      if (_.isObject(heightOrOrientation)) {
        options = heightOrOrientation
      }

      options = _.defaults({}, userOptions, { log: true })

      let height
      let width

      if (options.log) {
        // The type of presetOrWidth is either string or number
        // When preset => string
        // When width => number
        const isPreset = typeof presetOrWidth === 'string'

        options._log = Cypress.log({
          timeout: options.timeout,
          consoleProps () {
            const obj = {}

            if (isPreset) {
              obj.Preset = presetOrWidth
            }

            obj.Width = width
            obj.Height = height

            return obj
          },
        })
      }

      const throwErrBadArgs = () => {
        return $errUtils.throwErrByPath('viewport.bad_args', { onFail: options._log })
      }

      const widthAndHeightAreValidNumbers = (width, height) => {
        return _.every([width, height], (val) => {
          return _.isNumber(val) && _.isFinite(val)
        })
      }

      const widthAndHeightAreWithinBounds = (width, height) => {
        return _.every([width, height], (val) => {
          return val >= 0
        })
      }

      if (_.isString(presetOrWidth) && _.isBlank(presetOrWidth)) {
        $errUtils.throwErrByPath('viewport.empty_string', { onFail: options._log })
      } else if (_.isString(presetOrWidth)) {
        const getPresetDimensions = (preset) => {
          try {
            return _.map(viewports[presetOrWidth].split('x'), Number)
          } catch (e) {
            const presets = _.keys(viewports).join(', ')

            return $errUtils.throwErrByPath('viewport.missing_preset', {
              onFail: options._log,
              args: { preset, presets },
            })
          }
        }

        const orientationIsValidAndLandscape = (orientation) => {
          if (!validOrientations.includes(orientation)) {
            const all = validOrientations.join('` or `')

            $errUtils.throwErrByPath('viewport.invalid_orientation', {
              onFail: options._log,
              args: { all, orientation },
            })
          }

          return orientation === 'landscape'
        }

        const preset = presetOrWidth
        const orientation = heightOrOrientation

        // get preset, split by x, convert to a number
        const dimensions = getPresetDimensions(preset)

        if (_.isString(orientation)) {
          if (orientationIsValidAndLandscape(orientation)) {
            dimensions.reverse()
          }
        }

        [width, height] = dimensions
      } else if (widthAndHeightAreValidNumbers(presetOrWidth, heightOrOrientation)) {
        width = presetOrWidth
        height = heightOrOrientation

        if (!widthAndHeightAreWithinBounds(width, height)) {
          $errUtils.throwErrByPath('viewport.dimensions_out_of_range', { onFail: options._log })
        }
      } else {
        throwErrBadArgs()
      }

      return setViewportAndSynchronize(width, height)
      .then((viewport) => {
        if (options._log) {
          options._log.set(viewport)
        }

        return null
      })
    },

  })
}
