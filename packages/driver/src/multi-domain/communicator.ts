import debugFn from 'debug'
import { EventEmitter } from 'events'
import { preprocessConfig, preprocessEnv } from '../util/config'
import { preprocessForSerialization } from '../util/serialization'

const debug = debugFn('cypress:driver:multi-domain')

const CROSS_DOMAIN_PREFIX = 'cross:domain:'

declare global {
  interface Window { specBridgeDomain: string }
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
  private windowReference: Window | undefined
  private crossDomainDriverWindows: {[key: string]: Window} = {}

  /**
   * Initializes the event handler to receive messages from the spec bridge.
   * @param {Window} win - a reference to the window object in the primary domain.
   * @returns {Void}
   */
  initialize (win: Window) {
    if (this.windowReference) return

    this.windowReference = win

    this.windowReference.top?.addEventListener('message', ({ data, source }) => {
      // currently used for tests, can be removed later
      if (data?.actual) return

      // check if message is cross domain and if so, feed the message into
      // the cross domain bus with args and strip prefix
      if (data?.event?.includes(CROSS_DOMAIN_PREFIX)) {
        const messageName = data.event.replace(CROSS_DOMAIN_PREFIX, '')

        // NOTE: need a special case here for 'bridge:ready'
        // where we need to set the crossDomainDriverWindow to source to
        // communicate back to the iframe
        if (messageName === 'bridge:ready' && source) {
          this.crossDomainDriverWindows[data.domain] = source as Window
        }

        this.emit(messageName, data.data, data.domain)

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
  toAllSpecBridges (event: string, data?: any) {
    debug('=> to all spec bridges', event, data)
    // If there is no crossDomainDriverWindow, there is no need to send the message.
    Object.values(this.crossDomainDriverWindows).forEach((win: Window) => {
      win.postMessage({
        event,
        data,
      }, '*')
    })
  }

  toSpecBridge (domain: string, event: string, data?: any) {
    debug('=> to spec bridge', domain, event, data)
    // If there is no crossDomainDriverWindow, there is no need to send the message.
    this.crossDomainDriverWindows[domain]?.postMessage({
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

  private handleSubjectAndErr = (data: any = {}, send: (data: any) => void) => {
    let { subject, err, ...rest } = data

    // check to see if the 'err' key is defined, and if it is, we have an error of any type
    const hasMultiDomainError = !!Object.getOwnPropertyDescriptor(data, 'err')

    if (!subject && !hasMultiDomainError) {
      return send(rest)
    }

    try {
      if (hasMultiDomainError) {
        try {
          err = preprocessForSerialization(err)
        } catch (e) {
          err = e
        }
      }

      // We always want to make sure errors are posted, so clean it up to send.
      send({ ...rest, subject, err, hasMultiDomainError })
    } catch (err: any) {
      if (subject && err.name === 'DataCloneError') {
        // Send the type of object that failed to serialize.
        // If the subject threw the 'DataCloneError', the subject cannot be
        // serialized, at which point try again with an undefined subject.
        return this.handleSubjectAndErr({ ...rest, unserializableSubjectType: typeof subject }, send)
      }

      // Try to send the message again, with the new error.
      this.handleSubjectAndErr({ ...rest, err }, send)
    }
  }

  private syncConfigEnvToPrimary = () => {
    this.toPrimary('sync:config', {
      config: preprocessConfig(Cypress.config()),
      env: preprocessEnv(Cypress.env()),
    })
  }

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
  toPrimary (event: string, data?: any, options = { syncConfig: false }) {
    debug('<= to Primary ', event, data, window.specBridgeDomain)
    if (options.syncConfig) this.syncConfigEnvToPrimary()

    this.handleSubjectAndErr(data, (data: any) => {
      this.windowReference.top.postMessage({
        event: `${CROSS_DOMAIN_PREFIX}${event}`,
        data,
        domain: window.specBridgeDomain,
      }, '*')
    })
  }
}
