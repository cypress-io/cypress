import _ from 'lodash'
import $errUtils from '../../../cypress/error_utils'

// How cy.trigger builds and dispatches an event in the AUT's document, shared with the remote driver's agent
export const dispatch = (target, appWindow, eventName, options) => {
  const eventConstructor = options.eventConstructor ?? 'Event'
  const ctor = appWindow[eventConstructor]

  if (typeof ctor !== 'function') {
    $errUtils.throwErrByPath('trigger.invalid_event_type', {
      args: { eventConstructor },
    })
  }

  // eventConstructor property should not be added to event instance.
  delete options.eventConstructor

  // https://github.com/cypress-io/cypress/issues/3686
  // UIEvent and its derived events like MouseEvent, KeyboardEvent
  // has a property, view, which is the window object where the event happened.
  // Logic below checks the ctor function is UIEvent itself or its children
  // and adds view to the instance init object.
  if (ctor === appWindow['UIEvent'] || ctor.prototype instanceof appWindow['UIEvent']) {
    options.view = appWindow
  }

  const event = new ctor(eventName, options)

  // some options, like clientX & clientY, must be set on the
  // instance instead of passing them into the constructor
  _.extend(event, options)

  return target.dispatchEvent(event)
}

export const addEventCoords = (eventOptions, coords) => {
  const { fromElWindow, fromElViewport } = coords

  return _.extend({
    clientX: fromElViewport.x,
    clientY: fromElViewport.y,
    screenX: fromElViewport.x,
    screenY: fromElViewport.y,
    pageX: fromElWindow.x,
    pageY: fromElWindow.y,
  }, eventOptions)
}
