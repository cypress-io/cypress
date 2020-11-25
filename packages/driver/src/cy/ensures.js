const _ = require('lodash')
const $dom = require('../dom')
const $utils = require('../cypress/utils')
const $errUtils = require('../cypress/error_utils')
const $elements = require('../dom/elements')

const VALID_POSITIONS = 'topLeft top topRight left center right bottomLeft bottom bottomRight'.split(' ')

// TODO: in 4.0 we should accept a new validation type called 'elements'
// which accepts an array of elements (and they all have to be elements!!)
// this would fix the TODO below, and also ensure that commands understand
// they may need to work with both element arrays, or specific items
// such as a single element, a single document, or single window

let returnFalse = () => {
  return false
}

const create = (state, expect) => {
  // TODO: we should probably normalize all subjects
  // into an array and loop through each and verify
  // each element in the array is valid. as it stands
  // we only validate the first
  const validateType = (subject, type, cmd) => {
    const name = cmd.get('name')

    switch (type) {
      case 'element':
        // if this is an element then ensure its currently attached
        // to its document context
        if ($dom.isElement(subject)) {
          ensureAttached(subject, name)
        }

        // always ensure this is an element
        return ensureElement(subject, name)

      case 'document':
        return ensureDocument(subject, name)

      case 'window':
        return ensureWindow(subject, name)

      default:
        return
    }
  }

  const ensureSubjectByType = (subject, type) => {
    const current = state('current')

    let types = [].concat(type)

    // if we have an optional subject and nothing's
    // here then just return cuz we good to go
    if (types.includes('optional') && _.isUndefined(subject)) {
      return
    }

    // okay we either have a subject and either way
    // slice out optional so we can verify against
    // the various types
    types = _.without(types, 'optional')

    // if we have no types then bail
    if (types.length === 0) {
      return
    }

    let err
    const errors = []

    for (type of types) {
      try {
        validateType(subject, type, current)
      } catch (error) {
        err = error
        errors.push(err)
      }
    }

    // every validation failed and we had more than one validation
    if (errors.length === types.length) {
      err = errors[0]

      if (types.length > 1) {
        // append a nice error message telling the user this
        const errProps = $errUtils.appendErrMsg(err, `All ${types.length} subject validations failed on this subject.`)

        $errUtils.mergeErrProps(err, errProps)
      }

      throw err
    }
  }

  const ensureRunnable = (name) => {
    if (!state('runnable')) {
      return $errUtils.throwErrByPath('miscellaneous.outside_test_with_cmd', {
        args: {
          cmd: name,
        },
      })
    }
  }

  const ensureElementIsNotAnimating = ($el, coords = [], threshold) => {
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
      const cmd = state('current').get('name')
      const node = $dom.stringify($el)

      return $errUtils.throwErrByPath('dom.animating', {
        args: { cmd, node },
      })
    }
  }

  const ensureNotDisabled = (subject, onFail) => {
    const cmd = state('current').get('name')

    if (subject.prop('disabled')) {
      const node = $dom.stringify(subject)

      return $errUtils.throwErrByPath('dom.disabled', {
        onFail,
        args: { cmd, node },
      })
    }
  }

  const ensureNotReadonly = (subject, onFail) => {
    const cmd = state('current').get('name')

    // readonly can only be applied to input/textarea
    // not on checkboxes, radios, etc..
    if ($dom.isTextLike(subject.get(0)) && subject.prop('readonly')) {
      const node = $dom.stringify(subject)

      return $errUtils.throwErrByPath('dom.readonly', {
        onFail,
        args: { cmd, node },
      })
    }
  }

  const ensureVisibility = (subject, onFail) => {
    if (subject.length !== subject.filter(function () {
      return !$dom.isHidden(this, 'isVisible()', { checkOpacity: false })
    }).length) {
      const cmd = state('current').get('name')
      const reason = $dom.getReasonIsHidden(subject, { checkOpacity: false })
      const node = $dom.stringify(subject)

      return $errUtils.throwErrByPath('dom.not_visible', {
        onFail,
        args: { cmd, node, reason },
      })
    }
  }

  const ensureAttached = (subject, name, onFail) => {
    if ($dom.isDetached(subject)) {
      const current = state('current')

      const cmd = name ?? current.get('name')

      const prev = current.get('prev') ? current.get('prev').get('name') : current.get('name')
      const node = $dom.stringify(subject)

      return $errUtils.throwErrByPath('subject.not_attached', {
        onFail,
        args: { cmd, prev, node },
      })
    }
  }

  const ensureElement = (subject, name, onFail) => {
    if (!$dom.isElement(subject)) {
      const prev = state('current').get('prev')

      return $errUtils.throwErrByPath('subject.not_element', {
        onFail,
        args: {
          name,
          subject: $utils.stringifyActual(subject),
          previous: prev.get('name'),
        },
      })
    }
  }

  const ensureWindow = (subject, name) => {
    if (!$dom.isWindow(subject)) {
      const prev = state('current').get('prev')

      return $errUtils.throwErrByPath('subject.not_window_or_document', {
        args: {
          name,
          type: 'window',
          subject: $utils.stringifyActual(subject),
          previous: prev.get('name'),
        },
      })
    }
  }

  const ensureDocument = (subject, name) => {
    if (!$dom.isDocument(subject)) {
      const prev = state('current').get('prev')

      return $errUtils.throwErrByPath('subject.not_window_or_document', {
        args: {
          name,
          type: 'document',
          subject: $utils.stringifyActual(subject),
          previous: prev.get('name'),
        },
      })
    }
  }

  const ensureExistence = (subject) => {
    returnFalse = () => {
      cleanup()

      return false
    }

    const cleanup = () => {
      return state('onBeforeLog', null)
    }

    // prevent any additional logs this is an implicit assertion
    state('onBeforeLog', returnFalse)

    // verify the $el exists and use our default error messages
    // TODO: always unbind if our expectation failed
    try {
      expect(subject).to.exist
    } catch (err) {
      cleanup()

      throw err
    }
  }

  const ensureElExistence = ($el) => {
    // dont throw if this isnt even a DOM object
    // return if not $dom.isJquery($el)

    // ensure that we either had some assertions
    // or that the element existed
    if ($el && $el.length) {
      return
    }

    // TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
    // OR GO THROUGH I18N

    return ensureExistence($el)
  }

  const ensureElDoesNotHaveCSS = ($el, cssProperty, cssValue, onFail) => {
    const cmd = state('current').get('name')
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

      return $errUtils.throwErrByPath('dom.pointer_events_none', {
        onFail,
        args: {
          cmd,
          element,
          elementInherited,
        },
        errProps: {
          consoleProps,
        },
      })
    }
  }

  const ensureDescendents = ($el1, $el2, onFail) => {
    const cmd = state('current').get('name')

    if (!$dom.isDescendent($el1, $el2)) {
      if ($el2) {
        const element1 = $dom.stringify($el1)
        const element2 = $dom.stringify($el2)

        return $errUtils.throwErrByPath('dom.covered', {
          onFail,
          args: { cmd, element1, element2 },
          errProps: {
            consoleProps: {
              'But its Covered By': $dom.getElements($el2),
            },
          },
        })
      }

      const node = $dom.stringify($el1)

      return $errUtils.throwErrByPath('dom.center_hidden', {
        onFail,
        args: { cmd, node },
        errProps: {
          consoleProps: {
            'But its Covered By': $dom.getElements($el2),
          },
        },
      })
    }
  }

  const ensureValidPosition = (position, log) => {
    // make sure its valid first!
    if (VALID_POSITIONS.includes(position)) {
      return true
    }

    return $errUtils.throwErrByPath('dom.invalid_position_argument', {
      onFail: log,
      args: {
        position,
        validPositions: VALID_POSITIONS.join(', '),
      },
    })
  }

  const ensureScrollability = ($el, cmd) => {
    if ($dom.isScrollable($el)) {
      return true
    }

    // prep args to throw in error since we can't scroll
    cmd = cmd ?? state('current').get('name')

    const node = $dom.stringify($el)

    return $errUtils.throwErrByPath('dom.not_scrollable', {
      args: { cmd, node },
    })
  }

  return {
    ensureSubjectByType,

    ensureElement,

    ensureAttached,

    ensureRunnable,

    ensureWindow,

    ensureDocument,

    ensureElDoesNotHaveCSS,

    ensureElementIsNotAnimating,

    ensureNotDisabled,

    ensureVisibility,

    ensureExistence,

    ensureElExistence,

    ensureDescendents,

    ensureValidPosition,

    ensureScrollability,

    ensureNotReadonly,
  }
}

module.exports = {
  create,
}
