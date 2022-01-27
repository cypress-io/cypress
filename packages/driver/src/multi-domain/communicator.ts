import clone from 'clone'
import debugFn from 'debug'
import { EventEmitter } from 'events'
import _ from 'lodash'
import $dom from '../dom'

const debug = debugFn('cypress:driver:multi-domain')

const CROSS_DOMAIN_PREFIX = 'cross:domain:'

const serializeForPostMessage = (value) => {
  const { isDom } = $dom

  if (_.isError(value)) {
    const serializedError = _.mapValues(clone(value), serializeForPostMessage)

    return {
      ... serializedError,
      // Native Error types currently cannot be cloned in Firefox when using 'postMessage'.
      // Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm for more details
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  if (_.isArray(value)) {
    return _.map(value, serializeForPostMessage)
  }

  if (isDom(value)) {
    return $dom.stringify(value, 'short')
  }

  if (_.isFunction(value)) {
    return value.toString()
  }

  if (_.isObject(value)) {
    // clone to nuke circular references
    // and blow away anything that throws
    try {
      return _.mapValues(clone(value), serializeForPostMessage)
    } catch (err) {
      return null
    }
  }

  return value
}

/**
 * Primary domain communicator. Responsible for sending/receiving events throughout
 * the driver responsible for multi-domain communication, as well as sending/receiving events to/from the
 * spec bridge communicator, respectively.
 *
 * The 'postMessage' method is used to send events to the spec bridge communicator, while
 * the 'message' event is used to receive messages from the spec bridge communicator.
 * All events communicating across domains are prefixed with 'cross:domain:' under the hood.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage for more details.
 * @extends EventEmitter
 */
export class PrimaryDomainCommunicator extends EventEmitter {
  private windowReference
  private crossDomainDriverWindow

  /**
   * Initializes the event handler to receive messages from the spec bridge.
   * @param {Window} win - a reference to the window object in the primary domain.
   * @returns {Void}
   */
  initialize (win) {
    if (this.windowReference) return

    this.windowReference = win

    this.windowReference.top.addEventListener('message', ({ data, source }) => {
      // currently used for tests, can be removed later
      if (data?.actual) return

      // check if message is cross domain and if so, feed the message into
      // the cross domain bus with args and strip prefix
      if (data?.event?.includes(CROSS_DOMAIN_PREFIX)) {
        const messageName = data.event.replace(CROSS_DOMAIN_PREFIX, '')

        // NOTE: need a special case here for 'bridge:ready'
        // where we need to set the crossDomainDriverWindow to source to
        // communicate back to the iframe
        if (messageName === 'bridge:ready') {
          this.crossDomainDriverWindow = source
        }

        this.emit(messageName, data.data)

        return
      }

      debug('Unexpected postMessage:', data)
    }, false)
  }

  /**
   * Events to be sent to the spec bridge communicator instance.
   * @param {string} event - the name of the event to be sent.
   * @param {any} data - any meta data to be sent with the event.
   */
  toSpecBridge (event: string, data?: any) {
    this.crossDomainDriverWindow.postMessage({
      event,
      data,
    }, '*')
  }
}

/**
 * Spec bridge domain communicator. Responsible for sending/receiving events to/from the
 * primary domain communicator, respectively.
 *
 * The 'postMessage' method is used to send events to the primary communicator, while
 * the 'message' event is used to receive messages from the primary communicator.
 * All events communicating across domains are prefixed with 'cross:domain:' under the hood.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage for more details.
 * @extends EventEmitter
 */
export class SpecBridgeDomainCommunicator extends EventEmitter {
  private windowReference

  /**
   * Initializes the event handler to receive messages from the primary domain.
   * @param {Window} win - a reference to the window object in the spec bridge/iframe.
   * @returns {Void}
   */
  initialize (win) {
    if (this.windowReference) return

    this.windowReference = win

    this.windowReference.addEventListener('message', ({ data }) => {
      if (!data) return

      this.emit(data.event, data.data)
    }, false)
  }

  /**
   * Events to be sent to the primary communicator instance.
   * @param {string} event - the name of the event to be sent.
   * @param {any} data - any meta data to be sent with the event.
   */
  toPrimary (event: string, data?: any, serializer?: (data: any) => any) {
    let prefixedEvent = `${CROSS_DOMAIN_PREFIX}${event}`

    data = serializer ? serializer(data) : serializeForPostMessage(data)
    this.windowReference.top.postMessage({ event: prefixedEvent, data }, '*')
  }
}
