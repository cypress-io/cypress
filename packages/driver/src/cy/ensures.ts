import _ from 'lodash'
import $dom from '../dom'
import $utils from '../cypress/utils'
import $errUtils from '../cypress/error_utils'
import $elements from '../dom/elements'
import type { StateFunc } from '../cypress/state'
import type { $Cy } from '../cypress/cy'
import { isRunnerAbleToCommunicateWithAut } from '../util/commandAUTCommunication'

const VALID_POSITIONS = 'topLeft top topRight left center right bottomLeft bottom bottomRight'.split(' ')

// TODO: in 4.0 we should accept a new validation type called 'elements'
// which accepts an array of elements (and they all have to be elements!!)
// this would fix the TODO below, and also ensure that commands understand
// they may need to work with both element arrays, or specific items
// such as a single element, a single document, or single window

export const create = (state: StateFunc, expect: $Cy['expect']) => {
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

    let types: string[] = [].concat(type)

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
    const errors: Error[] = []

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
      $errUtils.throwErrByPath('miscellaneous.outside_test_with_cmd', {
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

      $errUtils.throwErrByPath('dom.animating', {
        args: { cmd, node },
      })
    }
  }

  const ensureNotDisabled = (subject, onFail) => {
    const cmd = state('current').get('name')

    if (subject.prop('disabled')) {
      const node = $dom.stringify(subject)

      $errUtils.throwErrByPath('dom.disabled', {
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

      $errUtils.throwErrByPath('dom.readonly', {
        onFail,
        args: { cmd, node },
      })
    }
  }

  const runVisibilityCheck = (subject, onFail, method) => {
    const visibleSubjects = subject.filter(function () {
      return !method(this, 'isVisible()', { checkOpacity: false })
    })

    if (subject.length !== visibleSubjects.length) {
      const cmd = state('current').get('name')
      const reason = $dom.getReasonIsHidden(subject, { checkOpacity: false })
      const node = $dom.stringify(subject)

      $errUtils.throwErrByPath('dom.not_visible', {
        onFail,
        args: { cmd, node, reason },
      })
    }
  }

  const ensureVisibility = (subject, onFail) => {
    return runVisibilityCheck(subject, onFail, $dom.isHidden)
  }

  const ensureStrictVisibility = (subject, onFail) => {
    return runVisibilityCheck(subject, onFail, $dom.isStrictlyHidden)
  }

  const ensureNotHiddenByAncestors = (subject, onFail) => {
    return runVisibilityCheck(subject, onFail, $dom.isHiddenByAncestors)
  }

  const ensureAttached = (subject, name, onFail?) => {
    if ($dom.isDetached(subject)) {
      const current = state('current')

      const cmd = name ?? current.get('name')

      const prev = current.get('prev') ? current.get('prev').get('name') : current.get('name')
      const node = $dom.stringify(subject)

      $errUtils.throwErrByPath('subject.not_attached', {
        onFail,
        args: { cmd, prev, node },
      })
    }
  }

  const ensureElement = (subject, name, onFail?) => {
    if (!$dom.isElement(subject)) {
      const prev = state('current').get('prev')

      $errUtils.throwErrByPath('subject.not_element', {
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

      $errUtils.throwErrByPath('subject.not_window_or_document', {
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

      $errUtils.throwErrByPath('subject.not_window_or_document', {
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
    // prevent any additional logs since this is an implicit assertion
    state('onBeforeLog', () => false)

    // verify the $el exists and use our default error messages
    try {
      expect(subject).to.exist
    } finally {
      state('onBeforeLog', null)
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

      $errUtils.throwErrByPath('dom.pointer_events_none', {
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
          args: { cmd, element1, element2 },
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
        args: { cmd, node },
        errProps: {
          consoleProps: {
            'But its Covered By': $dom.getElements($el2),
          },
        },
      })
    }
  }

  const ensureValidPosition = (position, log): true | void => {
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

  const ensureScrollability = ($el, cmd): true | void => {
    if ($dom.isScrollable($el)) {
      return true
    }

    // prep args to throw in error since we can't scroll
    cmd = cmd ?? state('current').get('name')

    const node = $dom.stringify($el)

    $errUtils.throwErrByPath('dom.not_scrollable', {
      args: { cmd, node },
    })
  }

  /**
   * ensureCommandCanCommunicateWithAUT will check if the command should be able to communicate with the AUT
   * If we can not communicate, throw an error.
   * Intended to use within retry loops.
   * err: optional error to pass end to be appended to if the assertion happened while the aut was cross origin.
   * @returns true or throws an error
   */
  const ensureCommandCanCommunicateWithAUT = (err?): boolean => {
    if (!isRunnerAbleToCommunicateWithAut()) {
      const crossOriginCommandError = $errUtils.errByPath('miscellaneous.cross_origin_command', {
        commandOrigin: window.location.origin,
        autOrigin: state('autLocation').origin,
      })

      if (err) {
        err = $errUtils.appendErrMsg(err, crossOriginCommandError.message)

        throw err
      } else {
        throw crossOriginCommandError
      }
    }

    return true
  }

  return {
    ensureElement,
    ensureAttached,
    ensureWindow,
    ensureDocument,
    ensureElDoesNotHaveCSS,
    ensureElementIsNotAnimating,
    ensureNotDisabled,
    ensureVisibility,
    ensureStrictVisibility,
    ensureNotHiddenByAncestors,
    ensureExistence,
    ensureElExistence,
    ensureDescendents,
    ensureValidPosition,
    ensureScrollability,
    ensureNotReadonly,
    ensureCommandCanCommunicateWithAUT,

    // internal functions
    ensureSubjectByType,
    ensureRunnable,
  }
}

export interface IEnsures extends Omit<
  ReturnType<typeof create>,
  'ensureSubjectByType' | 'ensureRunnable'
> {}
