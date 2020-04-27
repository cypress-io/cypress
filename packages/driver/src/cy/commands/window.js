/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $errUtils = require("../../cypress/error_utils");

const viewports = {
  "macbook-15" : "1440x900",
  "macbook-13" : "1280x800",
  "macbook-11" : "1366x768",
  "ipad-2"     : "768x1024",
  "ipad-mini"  : "768x1024",
  "iphone-xr"  : "414x896",
  "iphone-x"   : "375x812",
  "iphone-6+"  : "414x736",
  "iphone-6"   : "375x667",
  "iphone-5"   : "320x568",
  "iphone-4"   : "320x480",
  "iphone-3"   : "320x480",
  "samsung-s10" : "360x760",
  "samsung-note9" : "414x846"
};

const validOrientations = ["landscape", "portrait"];

//# NOTE: this is outside the function because its 'global' state to the
//# cypress application and not local to the specific run. the last
//# viewport set is always the 'current' viewport as opposed to the
//# config. there was a bug where re-running tests without a hard
//# refresh would cause viewport to hang
let currentViewport = null;

module.exports = function(Commands, Cypress, cy, state, config) {
  const defaultViewport = _.pick(config(), "viewportWidth", "viewportHeight");

  //# currentViewport could already be set due to previous runs
  if (currentViewport == null) { currentViewport = defaultViewport; }

  Cypress.on("test:before:run:async", () => //# if we have viewportDefaults it means
  //# something has changed the default and we
  //# need to restore prior to running the next test
  //# after which we simply null and wait for the
  //# next viewport change
  setViewportAndSynchronize(defaultViewport.viewportWidth, defaultViewport.viewportHeight));

  var setViewportAndSynchronize = function(width, height) {
    const viewport = {viewportWidth: width, viewportHeight: height};

    //# store viewport on the state for logs
    state(viewport);

    return new Promise(function(resolve) {
      if ((currentViewport.viewportWidth === width) && (currentViewport.viewportHeight === height)) {
        //# noop if viewport won't change
        return resolve(currentViewport);
      }

      currentViewport = {
        viewportWidth: width,
        viewportHeight: height
      };

      //# force our UI to change to the viewport and wait for it
      //# to be updated
      return Cypress.action("cy:viewport:changed", viewport, () => resolve(viewport));
    });
  };

  return Commands.addAll({
    title(options = {}) {
      let resolveTitle;
      const userOptions = options;
      options = _.defaults({}, userOptions, {log: true});

      if (options.log) {
        options._log = Cypress.log({
        });
      }

      return (resolveTitle = () => {
        const doc = state("document");

        const title = (doc && doc.title) || "";

        return cy.verifyUpcomingAssertions(title, options, {
          onRetry: resolveTitle
        });
      })();
    },

    window(options = {}) {
      let verifyAssertions;
      const userOptions = options;
      options = _.defaults({}, userOptions, {log: true});

      if (options.log) {
        options._log = Cypress.log({
        });
      }

      const getWindow = () => {
        const window = state("window");
        if (!window) { $errUtils.throwErrByPath("window.iframe_undefined", { onFail: options._log }); }

        return window;
      };

      //# wrap retrying into its own
      //# separate function
      var retryWindow = () => {
        return Promise
        .try(getWindow)
        .catch(err => {
          options.error = err;
          return cy.retry(retryWindow, options);
        });
      };

      return (verifyAssertions = () => {
        return Promise.try(retryWindow).then(win => {
          return cy.verifyUpcomingAssertions(win, options, {
            onRetry: verifyAssertions
          });
        });
      })();
    },

    document(options = {}) {
      let verifyAssertions;
      const userOptions = options;
      options = _.defaults({}, userOptions, {log: true});

      if (options.log) {
        options._log = Cypress.log({
        });
      }

      const getDocument = () => {
        const win = state("window");
        //# TODO: add failing test around logging twice
        if (!(win != null ? win.document : undefined)) { $errUtils.throwErrByPath("window.iframe_doc_undefined"); }

        return win.document;
      };

      //# wrap retrying into its own
      //# separate function
      var retryDocument = () => {
        return Promise
        .try(getDocument)
        .catch(err => {
          options.error = err;
          return cy.retry(retryDocument, options);
        });
      };

      return (verifyAssertions = () => {
        return Promise.try(retryDocument).then(doc => {
          return cy.verifyUpcomingAssertions(doc, options, {
            onRetry: verifyAssertions
          });
        });
      })();
    },

    viewport(presetOrWidth, heightOrOrientation, options = {}) {
      let height, width;
      const userOptions = options;

      if (_.isObject(heightOrOrientation)) {
        options = heightOrOrientation;
      }

      options = _.defaults({}, userOptions, { log: true });

      if (options.log) {
        options._log = Cypress.log({
          consoleProps() {
            const obj = {};
            if (preset) { obj.Preset = preset; }
            obj.Width  = width;
            obj.Height = height;
            return obj;
          }
        });
      }

      const throwErrBadArgs = () => {
        return $errUtils.throwErrByPath("viewport.bad_args", { onFail: options._log });
      };

      const widthAndHeightAreValidNumbers = (width, height) => _.every([width, height], val => _.isNumber(val) && _.isFinite(val));

      const widthAndHeightAreWithinBounds = (width, height) => _.every([width, height], val => val >= 0);

      switch (false) {
        case !_.isString(presetOrWidth) || !_.isBlank(presetOrWidth):
          $errUtils.throwErrByPath("viewport.empty_string", { onFail: options._log });
          break;

        case !_.isString(presetOrWidth):
          var getPresetDimensions = preset => {
            try {
              return _.map(viewports[presetOrWidth].split("x"), Number);
            } catch (e) {
              const presets = _.keys(viewports).join(", ");
              return $errUtils.throwErrByPath("viewport.missing_preset", {
                onFail: options._log,
                args: { preset, presets }
              });
            }
          };

          var orientationIsValidAndLandscape = orientation => {
            if (!validOrientations.includes(orientation)) {
              const all = validOrientations.join("` or `");
              $errUtils.throwErrByPath("viewport.invalid_orientation", {
                onFail: options._log,
                args: { all, orientation }
              });
            }

            return orientation === "landscape";
          };

          var preset      = presetOrWidth;
          var orientation = heightOrOrientation;

          //# get preset, split by x, convert to a number
          var dimensions = getPresetDimensions(preset);

          if (_.isString(orientation)) {
            if (orientationIsValidAndLandscape(orientation)) {
              dimensions.reverse();
            }
          }

          [width, height] = dimensions;
          break;

        case !widthAndHeightAreValidNumbers(presetOrWidth, heightOrOrientation):
          width = presetOrWidth;
          height = heightOrOrientation;

          if (!widthAndHeightAreWithinBounds(width, height)) {
            $errUtils.throwErrByPath("viewport.dimensions_out_of_range", { onFail: options._log });
          }
          break;

        default:
          throwErrBadArgs();
      }

      return setViewportAndSynchronize(width, height)
      .then(function(viewport) {
        if (options._log) {
          options._log.set(viewport);
        }

        return null;
      });
    }

  });
};
