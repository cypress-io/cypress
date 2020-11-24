const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')
const debug = require('debug')('cypress:driver:actionability')

const $dom = require('../dom')
const $elements = require('../dom/elements')
const $errUtils = require('../cypress/error_utils')

const delay = 50

const getFixedOrStickyEl = $dom.getFirstFixedOrStickyPositionParent
const getStickyEl = $dom.getFirstStickyPositionParent

const dispatchPrimedChangeEvents = function (state) {
  // if we have a changeEvent, dispatch it
  let changeEvent

  changeEvent = state('changeEvent')

  if (changeEvent) {
    return changeEvent()
  }
}

const scrollBehaviorOptionsMap = {
  top: 'start',
  bottom: 'end',
  center: 'center',
  nearest: 'nearest',
}

const getPositionFromArguments = function (positionOrX, y, options) {
  let position; let x

  if (_.isObject(positionOrX)) {
    options = positionOrX
    position = null
  } else if (_.isObject(y)) {
    options = y
    position = positionOrX
    y = null
    x = null
  } else if (_.every([positionOrX, y], _.isFinite)) {
    position = null
    x = positionOrX
  } else if (_.isString(positionOrX)) {
    position = positionOrX
  }

  return { options, position, x, y }
}

const ensureElIsNotCovered = function (cy, win, $el, fromElViewport, options, log, onScroll) {
  let $elAtCoords = null

  const getElementAtPointFromViewport = function (fromElViewport) {
    // get the element at point from the viewport based
    // on the desired x/y normalized coordinations
    let elAtCoords

    elAtCoords = $dom.getElementAtPointFromViewport(win.document, fromElViewport.x, fromElViewport.y)

    if (elAtCoords) {
      return $elAtCoords = $dom.wrap(elAtCoords)
    }
  }

  const ensureDescendents = function (fromElViewport) {
    // figure out the deepest element we are about to interact
    // with at these coordinates
    $elAtCoords = getElementAtPointFromViewport(fromElViewport)
    debug('elAtCoords', $elAtCoords)
    debug('el has pointer-events none?')
    cy.ensureElDoesNotHaveCSS($el, 'pointer-events', 'none', log)
    debug('is descendent of elAtCoords?')
    cy.ensureDescendents($el, $elAtCoords, log)

    return $elAtCoords
  }

  const ensureDescendentsAndScroll = function () {
    try {
      // use the initial coords fromElViewport
      return ensureDescendents(fromElViewport)
    } catch (err) {
      // if scrolling to element is off we re-throw as there is nothing to do
      if (options.scrollBehavior === false) {
        throw err
      }

      // if we're being covered by a fixed position element then
      // we're going to attempt to continously scroll the element
      // from underneath this fixed position element until we can't
      // anymore
      const $fixed = getFixedOrStickyEl($elAtCoords)

      debug('elAtCoords is fixed', !!$fixed)

      // if we dont have a fixed position
      // then just bail, cuz we need to retry async
      if (!$fixed) {
        throw err
      }

      const scrollContainerPastElement = function ($container, $fixed) {
        // get the width + height of the $fixed
        // since this is what we are scrolling past!
        const { width, height } = $dom.getElementPositioning($fixed)

        // what is this container currently scrolled?
        // using jquery here which normalizes window scroll props
        const currentScrollTop = $container.scrollTop()
        const currentScrollLeft = $container.scrollLeft()

        if (onScroll) {
          const type = $dom.isWindow($container) ? 'window' : 'container'

          onScroll($container, type)
        }

        // TODO: right here we could set all of the scrollable
        // containers on the log and include their scroll
        // positions.
        //
        // then the runner could ask the driver to scroll each one
        // into its correct position until it passed
        // if $dom.isWindow($container)
        //   log.set("scrollBy", { x: -width, y: -height })

        // we want to scroll in the opposite direction (up not down)
        // so just decrease the scrolled positions
        $container.scrollTop((currentScrollTop - height))

        return $container.scrollLeft((currentScrollLeft - width))
      }

      const getAllScrollables = function (scrollables, $el) {
        // nudge algorithm
        // starting at the element itself
        // walk up until and find all of the scrollable containers
        // until we reach null
        // then push in the window
        const $scrollableContainer = $dom.getFirstScrollableParent($el)

        if ($scrollableContainer) {
          scrollables.push($scrollableContainer)

          // recursively iterate
          return getAllScrollables(scrollables, $scrollableContainer)
        }

        // we're out of scrollable elements
        // so just push in $(win)
        scrollables.push($(win))

        return scrollables
      }

      // we want to scroll all of our containers until
      // this element becomes unhidden or retry async
      const scrollContainers = function (scrollables) {
        // hold onto all the elements we've scrolled
        // past in this cycle
        const elementsScrolledPast = []

        // pull off scrollables starting with the most outer
        // container which is window
        const $scrollableContainer = scrollables.pop()

        // we've reach the end of all the scrollables
        if (!$scrollableContainer) {
          // bail and just retry async
          throw err
        }

        const possiblyScrollMultipleTimes = function ($fixed) {
          // if we got something AND
          let needle

          if ($fixed && ((needle = $fixed.get(0), !elementsScrolledPast.includes(needle)))) {
            elementsScrolledPast.push($fixed.get(0))

            scrollContainerPastElement($scrollableContainer, $fixed)

            try {
              // now that we've changed scroll positions
              // we must recalculate whether this element is covered
              // since the element's top / left positions change.
              ({ fromElViewport } = getCoordinatesForEl(cy, $el, options))

              // this is a relative calculation based on the viewport
              // so these are the only coordinates we care about
              return ensureDescendents(fromElViewport)
            } catch (err) {
              // we failed here, but before scrolling the next container
              // we need to first verify that the element covering up
              // is the same one as before our scroll
              $elAtCoords = getElementAtPointFromViewport(fromElViewport)

              if ($elAtCoords) {
                // get the fixed element again
                $fixed = getFixedOrStickyEl($elAtCoords)

                // and possibly recursively scroll past it
                // if we haven't see it before
                return possiblyScrollMultipleTimes($fixed)
              }

              // getElementAtPoint was falsey, so target element is no longer in the viewport
              throw err
            }
          } else {
            return scrollContainers(scrollables)
          }
        }

        return possiblyScrollMultipleTimes($fixed)
      }

      // start nudging
      return scrollContainers(
        getAllScrollables([], $el),
      )
    }
  }

  try {
    ensureDescendentsAndScroll()
  } catch (error) {
    const err = error

    if (log) {
      log.set({
        consoleProps () {
          const obj = {}

          obj['Tried to Click'] = $dom.getElements($el)
          _.extend(obj, err.consoleProps)

          return obj
        },
      })
    }

    throw err
  }

  // return the final $elAtCoords
  return $elAtCoords
}

const getCoordinatesForEl = function (cy, $el, options) {
  // determine if this element is animating
  if (_.isFinite(options.x) && _.isFinite(options.y)) {
    return $dom.getElementCoordinatesByPositionRelativeToXY($el, options.x, options.y)
  }

  // Cypress.dom.getElementCoordinatesByPosition($el, options.position)
  return $dom.getElementCoordinatesByPosition($el, options.position)
}

const ensureNotAnimating = function (cy, $el, coordsHistory, animationDistanceThreshold) {
  // if we dont have at least 2 points
  // then automatically retry
  if (coordsHistory.length < 2) {
    $errUtils.throwErrByPath('dom.animation_coords_history_invalid')
  }

  // verify that our element is not currently animating
  // by verifying it is still at the same coordinates within
  // 5 pixels of x/y
  return cy.ensureElementIsNotAnimating($el, coordsHistory, animationDistanceThreshold)
}

const verify = function (cy, $el, options, callbacks) {
  _.defaults(options, {
    ensure: {
      position: true,
      visibility: true,
      notDisabled: true,
      notCovered: true,
      notAnimating: true,
      notReadonly: false,
      custom: false,
    },
  })

  const win = $dom.getWindowByElement($el.get(0))

  const { _log, force, position } = options

  const { onReady, onScroll } = callbacks

  if (!onReady) {
    throw new Error('actionability.verify must be passed an onReady callback')
  }

  // if we have a position we must validate
  // this ahead of time else bail early
  if (options.ensure.position && position) {
    try {
      cy.ensureValidPosition(position, _log)
    } catch (error) {
      // cannot proceed, give up
      const err = error

      return Promise.reject(err)
    }
  }

  return Promise.try(() => {
    let retryActionability
    const coordsHistory = []

    const runAllChecks = function () {
      let $elAtCoords

      if (force !== true) {
        // ensure it's attached
        cy.ensureAttached($el, null, _log)

        // ensure its 'receivable'
        if (options.ensure.notDisabled) {
          cy.ensureNotDisabled($el, _log)
        }

        if (options.scrollBehavior !== false) {
          // scroll the element into view
          const scrollBehavior = scrollBehaviorOptionsMap[options.scrollBehavior]

          $el.get(0).scrollIntoView({ block: scrollBehavior })
          debug('scrollIntoView:', $el[0])

          if (onScroll) {
            onScroll($el, 'element')
          }
        }

        // ensure its visible
        if (options.ensure.visibility) {
          cy.ensureVisibility($el, _log)
        }

        if (options.ensure.notReadonly) {
          cy.ensureNotReadonly($el, _log)
        }

        if (_.isFunction(options.custom)) {
          options.custom($el, _log)
        }
      }

      // now go get all the coords for this element
      const coords = getCoordinatesForEl(cy, $el, options)

      // if force is true OR waitForAnimations is false
      // then do not perform these additional ensures...
      if ((options.ensure.notAnimating) && (force !== true) && (options.waitForAnimations !== false)) {
        // store the coords that were absolute
        // from the window or from the viewport for sticky elements
        // (see https://github.com/cypress-io/cypress/pull/1478)

        const sticky = !!getStickyEl($el)

        coordsHistory.push(sticky ? coords.fromElViewport : coords.fromElWindow)

        // then we ensure the element isnt animating
        ensureNotAnimating(cy, $el, coordsHistory, options.animationDistanceThreshold)

        // now that we know our element isn't animating its time
        // to figure out if it's being covered by another element.
        // this calculation is relative from the viewport so we
        // only care about fromElViewport coords
        $elAtCoords = options.ensure.notCovered && ensureElIsNotCovered(cy, win, $el, coords.fromElViewport, options, _log, onScroll)
      }

      // pass our final object into onReady
      const finalCoords = getCoordinatesForEl(cy, $el, options)
      let finalEl

      // When a contenteditable element is selected, we don't go deeper,
      // because it is treated as a rich text field to users.
      if ($elements.hasContenteditableAttr($el.get(0))) {
        finalEl = $el
      } else {
        finalEl = $elAtCoords != null ? $elAtCoords : $el
      }

      return onReady(finalEl, finalCoords)
    }

    // we cannot enforce async promises here because if our
    // element passes every single check, we MUST fire the event
    // synchronously else we risk the state changing between
    // the checks and firing the event!
    return (retryActionability = function () {
      try {
        return runAllChecks()
      } catch (err) {
        options.error = err

        return cy.retry(retryActionability, options)
      }
    })()
  })
}

module.exports = {
  delay,
  verify,
  dispatchPrimedChangeEvents,
  getPositionFromArguments,
}
