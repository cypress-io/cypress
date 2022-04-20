import debugFn from 'debug'
import { EventEmitter } from 'events'
import { preprocessConfig, preprocessEnv } from '../util/config'
import { preprocessForSerialization, reifySerializedError } from '../util/serialization'
import { $Location } from '../cypress/location'

const debug = debugFn('cypress:driver:multi-origin')

const CROSS_ORIGIN_PREFIX = 'cross:origin:'

/**
 * Primary Origin communicator. Responsible for sending/receiving events throughout
 * the driver responsible for multi-origin communication, as well as sending/receiving events to/from the
 * spec bridge communicator, respectively.
 *
 * The 'postMessage' method is used to send events to the spec bridge communicator, while
 * the 'message' event is used to receive messages from the spec bridge communicator.
 * All events communicating across origins are prefixed with 'cross:origin:' under the hood.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage for more details.
 * @extends EventEmitter
 */
export class PrimaryOriginCommunicator extends EventEmitter {
  private crossOriginDriverWindows: {[key: string]: Window} = {}
  userInvocationStack?: string

  /**
   * The callback handler that receives messages from secondary origins.
   * @param {MessageEvent.data} data - a reference to the MessageEvent.data sent through the postMessage event. See https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
   * @param {MessageEvent.source} source - a reference to the MessageEvent.source sent through the postMessage event. See https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/source
   * @returns {Void}
   */
  onMessage ({ data, source }) {
    // check if message is cross origin and if so, feed the message into
    // the cross origin bus with args and strip prefix
    if (data?.event?.startsWith(CROSS_ORIGIN_PREFIX)) {
      const messageName = data.event.replace(CROSS_ORIGIN_PREFIX, '')

      // NOTE: need a special case here for 'bridge:ready'
      // where we need to set the crossOriginDriverWindows to source to
      // communicate back to the iframe
      if (messageName === 'bridge:ready' && source) {
        this.crossOriginDriverWindows[data.originPolicy] = source as Window
      }

      if (data?.data?.err) {
        data.data.err = reifySerializedError(data.data.err, this.userInvocationStack as string)
      }

      this.emit(messageName, data.data, data.originPolicy)

      return
    }

    debug('Unexpected postMessage:', data)
  }

  /**
   * Events to be sent to the spec bridge communicator instance.
   * @param {string} event - the name of the event to be sent.
   * @param {any} data - any meta data to be sent with the event.
   */
  toAllSpecBridges (event: string, data?: any) {
    debug('=> to all spec bridges', event, data)

    const preprocessedData = preprocessForSerialization<any>(data)

    // if user defined arguments are passed in, do NOT sanitize it.
    if (data?.args) {
      preprocessedData.args = data.args
    }

    // If there is no crossOriginDriverWindows, there is no need to send the message.
    Object.values(this.crossOriginDriverWindows).forEach((win: Window) => {
      win.postMessage({
        event,
        data: preprocessedData,
      }, '*')
    })
  }

  toSpecBridge (originPolicy: string, event: string, data?: any) {
    debug('=> to spec bridge', originPolicy, event, data)

    const preprocessedData = preprocessForSerialization<any>(data)

    // if user defined arguments are passed in, do NOT sanitize it.
    if (data?.args) {
      preprocessedData.args = data.args
    }

    // If there is no crossOriginDriverWindows, there is no need to send the message.
    this.crossOriginDriverWindows[originPolicy]?.postMessage({
      event,
      data: preprocessedData,
    }, '*')
  }
}

/**
 * Spec bridge communicator. Responsible for sending/receiving events to/from the
 * primary origin communicator, respectively.
 *
 * The 'postMessage' method is used to send events to the primary communicator, while
 * the 'message' event is used to receive messages from the primary communicator.
 * All events communicating across origins are prefixed with 'cross:origin:' under the hood.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage for more details.
 * @extends EventEmitter
 */
export class SpecBridgeCommunicator extends EventEmitter {
  private handleSubjectAndErr = (data: Cypress.ObjectLike = {}, send: (data: Cypress.ObjectLike) => void) => {
    let { subject, err, ...rest } = data

    // check to see if the 'err' key is defined, and if it is, we have an error of any type
    const hasError = !!Object.getOwnPropertyDescriptor(data, 'err')

    if (!subject && !hasError) {
      return send(rest)
    }

    try {
      if (hasError) {
        try {
          // give the `err` truthiness if it's a falsey value like undefined/null/false
          if (!err) {
            err = new Error(`${err}`)
          }

          err = preprocessForSerialization(err)
        } catch (e) {
          err = e
        }
      }

      // We always want to make sure errors are posted, so clean it up to send.
      send({ ...rest, subject, err })
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

  private syncGlobalsToPrimary = () => {
    this.toPrimary('sync:globals', {
      config: preprocessConfig(Cypress.config()),
      env: preprocessEnv(Cypress.env()),
    })
  }

  /**
   * The callback handler that receives messages from the primary origin.
   * @param {MessageEvent.data} data - a reference to the MessageEvent.data sent through the postMessage event. See https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
   * @returns {Void}
   */
  onMessage ({ data }) {
    if (!data) return

    this.emit(data.event, data.data)
  }

  /**
   * Events to be sent to the primary communicator instance.
   * @param {string} event - the name of the event to be sent.
   * @param {Cypress.ObjectLike} data - any meta data to be sent with the event.
   */
  toPrimary (event: string, data?: Cypress.ObjectLike, options: { syncGlobals: boolean } = { syncGlobals: false }) {
    const { originPolicy } = $Location.create(window.location.href)

    debug('<= to Primary ', event, data, originPolicy)
    if (options.syncGlobals) this.syncGlobalsToPrimary()

    this.handleSubjectAndErr(data, (data: Cypress.ObjectLike) => {
      window.top?.postMessage({
        event: `${CROSS_ORIGIN_PREFIX}${event}`,
        data,
        originPolicy,
      }, '*')
    })
  }
}
