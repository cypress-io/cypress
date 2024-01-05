import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'

import debugFn from 'debug'
import $dom from '../dom'
import $utils from './../cypress/utils'
import type { ElWindowPostion, ElViewportPostion, ElementPositioning } from '../dom/coordinates'
import $elements from '../dom/elements'
import $errUtils from '../cypress/error_utils'
import { callNativeMethod, getNativeProp } from '../dom/elements/nativeProps'
const debug = debugFn('cypress:driver:actionability')

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

const ensureElDoesNotHaveCSS = ($el, cssProperty, cssValue, name: string, onFail) => {
  const el = $el[0]
  const win = $dom.getWindowByElement(el)
  const value = win.getComputedStyle(el)[cssProperty]

  if (value === cssValue) {
    const elInherited = $elements.findParent(el, (el, prevEl) => {
      if (win.getComputedStyle(el)[cssProperty] !== cssValue) {
        return prevEl
      }
    })

    const element = $dom.stringify(el)
    const elementInherited = (el !== elInherited) && $dom.stringify(elInherited)

    const consoleProps = {
      'But it has CSS': `${cssProperty}: ${cssValue}`,
    }

    if (elementInherited) {
      _.extend(consoleProps, {
        'Inherited From': elInherited,
      })
    }

    $errUtils.throwErrByPath('dom.pointer_events_none', {
      onFail,
      args: {
        cmd: name,
        element,
        elementInherited,
      },
      errProps: {
        consoleProps,
      },
    })
  }
}

const ensureElIsNotAnimating = ($el, coords = [], threshold, name: string) => {
  const lastTwo = coords.slice(-2)

  // bail if we dont yet have two points
  if (lastTwo.length !== 2) {
    $errUtils.throwErrByPath('dom.animation_check_failed')
  }

  const [point1, point2] = lastTwo

  // verify that there is not a distance
  // greater than a default of '5' between
  // the points
  if ($utils.getDistanceBetween(point1, point2) > threshold) {
    const node = $dom.stringify($el)

    $errUtils.throwErrByPath('dom.animating', {
      args: { cmd: name, node },
    })
  }
}

const VALID_POSITIONS = 'topLeft top topRight left center right bottomLeft bottom bottomRight'.split(' ')
const ensureIsValidPosition = (position, log?): true | void => {
  // make sure its valid first!
  if (VALID_POSITIONS.includes(position)) {
    return true
  }

  $errUtils.throwErrByPath('dom.invalid_position_argument', {
    onFail: log,
    args: {
      position,
      validPositions: VALID_POSITIONS.join(', '),
    },
  })
}

const ensureIsDescendent = ($el1, $el2, name: string, onFail) => {
  if (!$dom.isDescendent($el1, $el2)) {
    // https://github.com/cypress-io/cypress/issues/18008
    // when an element inside a shadow root is covered by its shadow host
    if (
      $dom.isWithinShadowRoot($el1.get(0)) &&
        $el1.get(0).getRootNode() === $el2?.get(0).shadowRoot
    ) {
      return
    }

    if ($el2) {
      const element1 = $dom.stringify($el1)
      const element2 = $dom.stringify($el2)

      $errUtils.throwErrByPath('dom.covered', {
        onFail,
        args: { cmd: name, element1, element2 },
        errProps: {
          consoleProps: {
            'But its Covered By': $dom.getElements($el2),
          },
        },
      })
    }

    const node = $dom.stringify($el1)

    $errUtils.throwErrByPath('dom.center_hidden', {
      onFail,
      args: { cmd: name, node },
      errProps: {
        consoleProps: {
          'But its Covered By': $dom.getElements($el2),
        },
      },
    })
  }
}

const ensureElIsNotCovered = function (cy, win, $el, fromElViewport, options, log, onScroll) {
  let $elAtCoords: JQuery<any> | null = null

  const name = cy.state('current').get('name')
  const getElementAtPointFromViewport = function (fromElViewport) {
    // get the element at point from the viewport based
    // on the desired x/y normalized coordinations
    let elAtCoords

    elAtCoords = $dom.getElementAtPointFromViewport(win.document, fromElViewport.x, fromElViewport.y)

    if (elAtCoords) {
      $elAtCoords = $dom.wrap(elAtCoords)

      return $elAtCoords
    }

    return null
  }

  const ensureDescendents = function (fromElViewport) {
    // figure out the deepest element we are about to interact
    // with at these coordinates
    $elAtCoords = getElementAtPointFromViewport(fromElViewport)
    debug('elAtCoords', $elAtCoords)
    debug('el has pointer-events none?')
    ensureElDoesNotHaveCSS($el, 'pointer-events', 'none', name, log)
    debug('is descendent of elAtCoords?')
    ensureIsDescendent($el, $elAtCoords, name, log)

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
      // we're going to attempt to continuously scroll the element
      // from underneath this fixed position element until we can't
      // anymore
      const $fixed = getFixedOrStickyEl($elAtCoords)

      debug('elAtCoords is fixed', !!$fixed)

      // if we don't have a fixed position
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
        const elementsScrolledPast: JQuery<any>[] = []

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
          if ($fixed && !elementsScrolledPast.includes($fixed.get(0))) {
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
  } catch (error: any) {
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
  const cmd = cy.state('current').get('name')

  // if we dont have at least 2 points, we throw this error to force a
  // retry, which will get us another point.
  // this error is purposefully generic because if the actionability
  //check times out, this error is the one displayed to the user and
  // saying something like "coordsHistory must be at least 2 sets
  // of coords" is not very useful.
  // that would only happen if the actionability check times out, which
  // shouldn't happen with default timeouts, but could theoretically
  // on a very, very slow system
  // https://github.com/cypress-io/cypress/issues/3738
  if (coordsHistory.length < 2) {
    $errUtils.throwErrByPath('dom.actionability_failed', {
      args: {
        node: $dom.stringify($el),
        cmd,
      },
    })
  }

  // verify that our element is not currently animating
  // by verifying it is still at the same coordinates within
  // 5 pixels of x/y
  ensureElIsNotAnimating($el, coordsHistory, animationDistanceThreshold, cmd)
}

interface VerifyCallbacks {
  onReady?: (finalEl: any, coords: ElementPositioning, $el: any) => any
  onScroll?: ($el: any, type: 'element' | 'window' | 'container') => any
  subjectFn?: () => any
}

const verify = function (cy, $el, config, options, callbacks: VerifyCallbacks) {
  _.defaults(options, {
    scrollBehavior: config('scrollBehavior'),
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
  const name = cy.state('current').get('name')

  const { _log, force, position } = options

  const { onReady, onScroll } = callbacks

  if (!onReady) {
    throw new Error('actionability.verify must be passed an onReady callback')
  }

  // if we have a position we must validate
  // this ahead of time else bail early
  if (options.ensure.position && position) {
    try {
      ensureIsValidPosition(position, _log)
    } catch (error) {
      // cannot proceed, give up
      const err = error

      return Promise.reject(err)
    }
  }

  // scroll-behavior: smooth delays scrolling and causes the actionability
  // check to fail, so the only solution is to remove the behavior and
  // make scrolling occur instantly. we do this by adding a style tag
  // and then removing it after we finish scrolling
  // https://github.com/cypress-io/cypress/issues/3200
  const addScrollBehaviorFix = (element: JQuery<HTMLElement>) => {
    const affectedParents: Map<HTMLElement, string> = new Map()

    try {
      let parent: JQuery<HTMLElement> | null = element

      do {
        if ($dom.isScrollable(parent)) {
          const parentElement = parent[0]
          const style = getNativeProp(parentElement, 'style')
          const styles = getComputedStyle(parentElement)

          if (styles.scrollBehavior === 'smooth') {
            affectedParents.set(parentElement, callNativeMethod(style, 'getStyleProperty', 'scroll-behavior'))
            callNativeMethod(style, 'setStyleProperty', 'scroll-behavior', 'auto')
          }
        }

        parent = $dom.getParent(parent)
      } while (parent.length)
    } catch (err) {
      // the above shouldn't error, but out of an abundance of caution, we
      // ignore any errors since this fix isn't worth failing the test over
    }

    return () => {
      for (const [parent, value] of affectedParents) {
        const style = getNativeProp(parent, 'style')

        if (value === '') {
          if (callNativeMethod(style, 'getStyleProperty', 'length') === 1) {
            callNativeMethod(parent, 'removeAttribute', 'style')
          } else {
            callNativeMethod(style, 'removeProperty', 'scroll-behavior')
          }
        } else {
          callNativeMethod(style, 'setStyleProperty', 'scroll-behavior', value)
        }
      }
      affectedParents.clear()
    }
  }

  return Promise.try(() => {
    const coordsHistory: (ElViewportPostion | ElWindowPostion)[] = []

    const runAllChecks = function () {
      let $elAtCoords

      if (force !== true) {
        // ensure it's attached
        Cypress.ensure.isElement($el, name, _log)
        Cypress.ensure.isAttached($el, name, cy, _log)

        // ensure its 'receivable'
        if (options.ensure.notDisabled) {
          Cypress.ensure.isNotDisabled($el, name, _log)
        }

        if (options.scrollBehavior !== false) {
          // scroll the element into view
          const scrollBehavior = scrollBehaviorOptionsMap[options.scrollBehavior]
          const removeScrollBehaviorFix = addScrollBehaviorFix($el)

          debug('scrollIntoView:', $el[0])
          $el.get(0).scrollIntoView({ block: scrollBehavior })

          removeScrollBehaviorFix()

          if (onScroll) {
            onScroll($el, 'element')
          }
        }

        if (options.ensure.visibility) {
          // ensure element is visible but do not check if hidden by ancestors
          // until nudging algorithm occurs
          // https://whimsical.com/actionability-J38eY9K2Y3vA6uCMWtmLVA

          // @ts-ignore
          Cypress.ensure.isStrictlyVisible($el, name, _log)
        }

        if (options.ensure.notReadonly) {
          Cypress.ensure.isNotReadonly($el, name, _log)
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
      }

      if (force !== true) {
        // now that we know our element isn't animating its time
        // to figure out if it's being covered by another element.
        // this calculation is relative from the viewport so we
        // only care about fromElViewport coords
        $elAtCoords = options.ensure.notCovered && ensureElIsNotCovered(cy, win, $el, coords.fromElViewport, options, _log, onScroll)
        Cypress.ensure.isNotHiddenByAncestors($el, name, _log)
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

      return onReady(finalEl, finalCoords, $el)
    }

    // we cannot enforce async promises here because if our
    // element passes every single check, we MUST fire the event
    // synchronously else we risk the state changing between
    // the checks and firing the event!
    const retryActionability = () => {
      try {
        if (callbacks.subjectFn) {
          $el = callbacks.subjectFn()

          if ($el.length === 0 || $dom.isDetached($el)) {
            const current = cy.state('current')
            const subjectChain = cy.subjectChain(current.get('chainerId'))

            $errUtils.throwErrByPath('subject.detached_during_actionability', {
              args: { name: current.get('name'), subjectChain },
            })
          }
        }

        return runAllChecks()
      } catch (err) {
        options.error = err

        return cy.retry(retryActionability, options)
      }
    }

    return retryActionability()
  })
}

export default {
  delay,
  verify,
  dispatchPrimedChangeEvents,
  getPositionFromArguments,
  ensureIsValidPosition,
}
