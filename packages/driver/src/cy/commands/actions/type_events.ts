import _ from 'lodash'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $selection from '../../../dom/selection'
import type { StateFunc } from '../../../cypress/state'

import debugFn from 'debug'
const debug = debugFn('cypress:driver:command:type')

interface TypeEventsOptions {
  $el: JQuery<any>
  state: StateFunc
  isBrowser: (name: string) => boolean
  // fires the form's submit event and submits it unless a handler prevents it, as cy.submit does
  submit: (form: JQuery<any>) => void
  updateTable?: (...args) => void
}

const getDefaultButtons = (form) => {
  const formId = CSS.escape(form.attr('id'))
  const nestedButtons = form.find('input, button')

  const possibleDefaultButtons: JQuery<any> = formId ? $dom.wrap(_.uniq([
    ...nestedButtons,
    ...$dom.query('body', form.prop('ownerDocument')).find(`input[form="${formId}"], button[form="${formId}"]`),
  ])) : nestedButtons

  return possibleDefaultButtons.filter((__, el) => {
    const $el = $dom.wrap(el)

    return (
      ($dom.isSelector($el, 'input') && $dom.isInputType($el, 'submit')) ||
      ($dom.isSelector($el, 'button') && !$dom.isInputType($el, 'button') && !$dom.isInputType($el, 'reset'))
    )
  })
}

// The keyboard callbacks that give cy.type a browser's side effects: change events,
// implicit form submission and the clicks that {enter} and space send to buttons.
// Both the legacy driver and the remote driver's agent type through them.
export const createTypeEventHandlers = ({ $el, state, isBrowser, submit, updateTable }: TypeEventsOptions) => {
  const simulateSubmitHandler = function () {
    const form = $el.parents('form')

    if (!form.length) {
      return
    }

    const multipleInputsAllowImplicitSubmissionAndNoSubmitElements = function (form) {
      const submits = getDefaultButtons(form)

      // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
      // some types of inputs can submit the form when hitting {enter}
      // but only if they are the sole input that allows implicit submission
      // and there are no buttons or input[submits] in the form
      const implicitSubmissionInputs = form.find('input').filter((__, input) => {
        const $input = $dom.wrap(input)

        return $elements.isInputAllowingImplicitFormSubmission($input)
      })

      return (implicitSubmissionInputs.length > 1) && (submits.length === 0)
    }

    // throw an error here if there are multiple form parents

    // bail if we have multiple inputs allowing implicit submission and no submit elements
    if (multipleInputsAllowImplicitSubmissionAndNoSubmitElements(form)) {
      return
    }

    const clickedDefaultButton = function (button) {
      // find the 'default button' as per HTML spec and click it natively
      // do not issue mousedown / mouseup since this is supposed to be synthentic
      if (button.length) {
        button.get(0).click()

        return true
      }

      return false
    }

    const getDefaultButton = (form) => {
      return getDefaultButtons(form).first()
    }

    const defaultButtonisDisabled = (button) => {
      return button.prop('disabled')
    }

    const defaultButton = getDefaultButton(form)

    // bail if the default button is in a 'disabled' state
    if (defaultButtonisDisabled(defaultButton)) {
      return
    }

    // WebKit will send the submit with an Enter keypress event,
    // so we do need to click the default button in this case.
    if (!isBrowser('webkit')) {
      // issue the click event to the 'default button' of the form
      // we need this to be synchronous so not going through our
      // own click command
      // as of now, at least in Chrome, causing the click event
      // on the button will indeed trigger the form submit event
      // so we dont need to fire it manually anymore!
      if (!clickedDefaultButton(defaultButton)) {
        // if we weren't able to click the default button
        // then synchronously fire the submit event
        // currently this is sync but if we use a waterfall
        // promise in the submit command it will break again
        // consider changing type to a Promise and juggle logging
        return submit(form)
      }
    }
  }

  const dispatchChangeEvent = function (el, id) {
    const change = document.createEvent('HTMLEvents')

    change.initEvent('change', true, false)

    const dispatched = el.dispatchEvent(change)

    if (id && updateTable) {
      return updateTable(id, null, 'change', null, dispatched)
    }
  }

  const needSingleValueChange = (el) => {
    return $elements.isNeedSingleValueChangeInputElement(el)
  }

  // see comment in updateValue below
  let typed = ''

  const isContentEditable = $elements.isContentEditable($el.get(0))
  const isTextarea = $elements.isTextarea($el.get(0))

  const fireClickEvent = (el) => {
    const ctor = $dom.getDocumentFromElement(el).defaultView!.PointerEvent
    const event = new ctor('click', { composed: true })

    el.dispatchEvent(event)
  }

  let keydownEvents: any[] = []

  return {
    updateValue (el, key, charsToType) {
      // in these cases, the value must only be set after all
      // the characters are input because attemping to set
      // a partial/invalid value results in the value being
      // set to an empty string
      if (needSingleValueChange(el)) {
        typed += key
        if (typed === charsToType) {
          return $elements.setNativeProp(el, 'value', charsToType)
        }
      }

      return $selection.replaceSelectionContents(el, key)
    },

    onEvent (id, key, event, value) {
      if (updateTable) {
        updateTable(id, key, event, value)
      }

      if (event.type === 'keydown') {
        keydownEvents.push(event.target)
      }

      if (
        (
          !isBrowser('firefox') ||
          // Firefox no longer sends click events automatically for <button>
          // and <input> elements, so we have to send them ourselves.
          // event.target is null when the element is within the shadow DOM
          (event.target && ($elements.isButton(event.target) || $elements.isInput(event.target)))
        ) &&
        // Click event is sent after keyup event with space key.
        event.type === 'keyup' && event.code === 'Space' &&
        // When event is prevented, the click event should not be emitted
        !event.defaultPrevented &&
        // Click events should be only sent to button-like elements.
        // event.target is null when used with shadow DOM.
        (event.target && $elements.isButtonLike(event.target)) &&
        // When a space key is pressed for input radio elements, the click event is only fired when it's not checked.
        !(event.target.tagName === 'INPUT' && event.target.type === 'radio' && event.target.checked === true) &&
        // When a space key is pressed on another element, the click event should not be fired.
        keydownEvents.includes(event.target)
      ) {
        fireClickEvent(event.target)

        keydownEvents = []
      }
    },

    // fires only when the 'value'
    // of input/text/contenteditable
    // changes
    onValueChange (originalText, el) {
      debug('onValueChange', originalText, el)
      // contenteditable should never be called here.
      // only inputs and textareas can have change events
      const changeEvent = state('changeEvent')

      if (changeEvent) {
        if (!changeEvent(null, true)) {
          state('changeEvent', null)
        }

        return
      }

      return state('changeEvent', (id, readOnly) => {
        const changed =
          $elements.getNativeProp(el, 'value') !== originalText

        if (!readOnly) {
          if (changed) {
            dispatchChangeEvent(el, id)
          }

          state('changeEvent', null)
        }

        return changed
      })
    },

    onEnterPressed (el) {
      // dont dispatch change events or handle
      // submit event if we've pressed enter into
      // a textarea or contenteditable
      if (isTextarea || isContentEditable) {
        return
      }

      // click event is only fired on button, image, submit, reset elements.
      // That's why we cannot use $elements.isButtonLike() here.
      const type = (type) => $elements.isInputType(el, type)
      const sendClickEvent = type('button') || type('image') || type('submit') || type('reset')

      // https://github.com/cypress-io/cypress/issues/19541
      // Send click event on type('{enter}')
      if (sendClickEvent) {
        if (
          !isBrowser('firefox') ||
          // Firefox no longer sends click events automatically for <input>
          // and <button> elements, so we have to send them ourselves.
          $elements.isInput(el) ||
          $elements.isButton(el)
        ) {
          fireClickEvent(el)
        }
      }

      // if our value has changed since our
      // element was activated we need to
      // fire a change event immediately
      const changeEvent = state('changeEvent')

      if (changeEvent) {
        changeEvent()
      }

      // handle submit event handler here
      return simulateSubmitHandler()
    },
  }
}
