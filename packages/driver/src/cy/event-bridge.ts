import _ from 'lodash'

type EventListener = Parameters<Window['addEventListener']>[1]

type EventHandlerBridge = <T extends EventListener>(fn: T) => T

export interface ContentWindow extends Window {
  __cypressEventBridgeFn?: EventHandlerBridge
  __cypressEventListenerMap?: Record<string, EventListener>
  Function: typeof Function
}

/**
 * Sets an event handler defined in the AUT on the window for easy access later,
 * when we need a handler defined in the window
 */
export function setEventListenerBridge (contentWindow: ContentWindow, eventHandlerBridge?: <T extends EventListener>(fn: T) => T) {
  contentWindow.__cypressEventBridgeFn = eventHandlerBridge
}

/**
 * When we create a listener from the runner for the AUT, we need to ensure the function
 * is correctly associated with the AUT, otherwise the event will not be associated correctly.
 *
 * We do this using the fn set by setListenerEventBridge, called on mount - or by creating
 * a function associated with the content window.
 */
export function bridgeContentWindowListener (contentWindow: ContentWindow, cb: EventListener) {
  if (contentWindow.__cypressEventBridgeFn) {
    return contentWindow.__cypressEventBridgeFn(cb)
  }

  const eventId = _.uniqueId('evt')

  contentWindow.__cypressEventListenerMap = contentWindow.__cypressEventListenerMap || {}
  contentWindow.__cypressEventListenerMap[eventId] = cb

  return new contentWindow.Function('evt', `window.__cypressEventListenerMap[${eventId}](evt)`)
}
