import _ from 'lodash'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'
import type { $Cy } from './cy'
import { isRunnerAbleToCommunicateWithAut } from '../util/commandAUTCommunication'

// TODO: in 4.0 we should accept a new validation type called 'elements'
// which accepts an array of elements (and they all have to be elements!!)
// this would fix the TODO below, and also ensure that commands understand
// they may need to work with both element arrays, or specific items
// such as a single element, a single document, or single window

// TODO: we should probably normalize all subjects
// into an array and loop through each and verify
// each element in the array is valid. as it stands
// we only validate the first
const validateType = (subject, type, name: string, cy: $Cy) => {
  switch (type) {
    case 'element':
      // if this is an element then ensure its currently attached
      // to its document context
      if ($dom.isElement(subject)) {
        isAttached(subject, name, cy)
      }

      // always ensure this is an element
      return isElement(subject, name, cy)

    case 'document':
      return isDocument(subject, name, cy)

    case 'window':
      return isWindow(subject, name, cy)

    default:
      return
  }
}

const isType = (subject, type, name: string, cy: $Cy) => {
  let types: (string | boolean)[] = [].concat(type)

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
      validateType(subject, type, name, cy)
    } catch (error) {
      err = error
      errors.push(err)
    }
  }

  function wordJoin (array) {
    const copy = [...array]
    const last = copy.pop()

    return `${copy.join(', ')} or ${last}`
  }

  // every validation failed and we had more than one validation
  if (errors.length === types.length) {
    err = errors[0]

    if (types.length > 1) {
      // append a nice error message telling the user this
      const msg = err.message.replace(/(failed because it requires .*)\./, `${wordJoin(['$1', ...types.slice(1)]) }.`)
      const errProps = $errUtils.modifyErrMsg(err, '', () => msg)

      $errUtils.mergeErrProps(err, errProps)
    }

    throw err
  }
}

const isChildCommand = (command, args, cy: $Cy) => {
  if (cy.subjectChain(command.get('chainerId')) === undefined) {
    const stringifiedArg = $utils.stringifyActual(args[0])

    $errUtils.throwErrByPath('miscellaneous.invoking_child_without_parent', {
      args: {
        cmd: command.get('name'),
        args: _.isString(args[0]) ? `\"${stringifiedArg}\"` : stringifiedArg,
      },
    })
  }
}

const isNotDisabled = (subject, name: string, onFail) => {
  if (subject.prop('disabled')) {
    const node = $dom.stringify(subject)

    $errUtils.throwErrByPath('dom.disabled', {
      onFail,
      args: { cmd: name, node },
    })
  }
}

const isNotReadonly = (subject, name: string, onFail) => {
  // readonly can only be applied to input/textarea
  // not on checkboxes, radios, etc..
  if ($dom.isTextLike(subject.get(0)) && subject.prop('readonly')) {
    const node = $dom.stringify(subject)

    $errUtils.throwErrByPath('dom.readonly', {
      onFail,
      args: { cmd: name, node },
    })
  }
}

const runVisibilityCheck = (subject, name: string, onFail, method) => {
  const visibleSubjects = subject.filter(function () {
    return !method(this, 'isVisible()', { checkOpacity: false })
  })

  if (subject.length !== visibleSubjects.length) {
    const reason = $dom.getReasonIsHidden(subject, { checkOpacity: false })
    const node = $dom.stringify(subject)

    $errUtils.throwErrByPath('dom.not_visible', {
      onFail,
      args: { cmd: name, node, reason },
    })
  }
}

const isVisible = (subject, name: string, onFail) => {
  return runVisibilityCheck(subject, name, onFail, $dom.isHidden)
}

const isStrictlyVisible = (subject, name: string, onFail) => {
  return runVisibilityCheck(subject, name, onFail, $dom.isStrictlyHidden)
}

const isNotHiddenByAncestors = (subject, name: string, onFail) => {
  return runVisibilityCheck(subject, name, onFail, $dom.isHiddenByAncestors)
}

const isAttached = (subject, name: string, cy: $Cy, onFail?) => {
  if ($dom.isDetached(subject)) {
    const current = cy.state('current')

    const subjectChain = cy.subjectChain(current.get('chainerId'))

    $errUtils.throwErrByPath('subject.detached_after_command', {
      onFail,
      args: { name, subjectChain },
    })
  }
}

const isElement = (subject, name: string, cy: $Cy, onFail?) => {
  if (!$dom.isElement(subject)) {
    const current = cy.state('current')

    if ($dom.isJquery(subject) && subject.length === 0) {
      const subjectChain = cy.subjectChain(current.get('chainerId'))
      const prevCommandWasQuery = current.get('prev').get('query')

      if (prevCommandWasQuery) {
        $errUtils.throwErrByPath('subject.not_element_empty_subject', {
          onFail,
          args: {
            name: current.get('name'),
            subjectChain,
          },
        })
      }
    }

    $errUtils.throwErrByPath('subject.not_element', {
      onFail,
      args: {
        name,
        subject: $utils.stringifyActual(subject),
        previous: current.get('prev').get('name'),
      },
    })
  }
}

const isWindow = (subject, name: string, cy: $Cy) => {
  if (!$dom.isWindow(subject)) {
    const prev = cy.state('current').get('prev')

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

const isDocument = (subject, name: string, cy: $Cy) => {
  if (!$dom.isDocument(subject)) {
    const prev = cy.state('current').get('prev')

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

const isScrollable = ($el, name, onFail?): true | void => {
  if ($dom.isScrollable($el)) {
    return true
  }

  const node = $dom.stringify($el)

  $errUtils.throwErrByPath('dom.not_scrollable', {
    onFail,
    args: { cmd: name, node },
  })
}

/**
  * commandCanCommunicateWithAUT will check if the command should be able to communicate with the AUT
  * If we can not communicate, throw an error.
  * Intended to use within retry loops.
  * err: optional error to pass end to be appended to if the assertion happened while the aut was cross origin.
  * @returns true or throws an error
  */
const commandCanCommunicateWithAUT = (cy: $Cy, err?): boolean => {
  if (!isRunnerAbleToCommunicateWithAut()) {
    const crossOriginCommandError = $errUtils.errByPath('miscellaneous.cross_origin_command', {
      commandOrigin: window.location.origin,
      autOrigin: cy.state('autLocation').origin,
      isInjectDocumentDomainEnabled: Cypress.config('injectDocumentDomain'),
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

export default {
  isType,
  isElement,
  isDocument,
  isWindow,

  isAttached,
  isNotDisabled,
  isNotHiddenByAncestors,
  isNotReadonly,
  isScrollable,
  isVisible,

  // internal functions
  commandCanCommunicateWithAUT,
  isChildCommand,
  isStrictlyVisible,
}
