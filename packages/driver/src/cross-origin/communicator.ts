import debugFn from 'debug'
import { EventEmitter } from 'events'
import { preprocessConfig, preprocessEnv } from '../util/config'
import { preprocessForSerialization, reifySerializedError } from '../util/serialization'
import { $Location } from '../cypress/location'
import { preprocessLogForSerialization, reifyLogFromSerialization, preprocessSnapshotForSerialization, reifySnapshotFromSerialization } from '../util/serialization/log'

const debug = debugFn('cypress:driver:multi-origin')

const CROSS_ORIGIN_PREFIX = 'cross:origin:'
const LOG_EVENTS = [`${CROSS_ORIGIN_PREFIX}log:added`, `${CROSS_ORIGIN_PREFIX}log:changed`]
const SNAPSHOT_EVENT_PREFIX = `${CROSS_ORIGIN_PREFIX}snapshot:`

/**
 * Shared Promise Setup, is a helper function to setup our promisified post messages.
 * @param resolve the promise resolve function
 * @param reject the promise reject function
 * @param data the data to send
 * @param event the name of the event to be promisified.
 * @param specBridgeName the name of the spec bridge receiving the event.
 * @param communicator the communicator that is sending the message
 * @param [timeout=1000] - in ms, if the promise does not complete during this timeout, fail the promise.
 * @returns the data to send
 */
const sharedPromiseSetup = ({
  resolve,
  reject,
  event,
  specBridgeName,
  communicator,
  timeout = 1000,
}: {
  resolve: Function
  reject: Function
  event: string
  specBridgeName: string
  communicator: EventEmitter
  timeout: number
}) => {
  let timeoutId

  const responseEvent = `${event}:${Date.now()}`

  const handler = (result) => {
    clearTimeout(timeoutId)
    resolve(result)
  }

  timeoutId = setTimeout(() => {
    communicator.off(responseEvent, handler)
    reject(new Error(`${event} failed to receive a response from ${specBridgeName} spec bridge within ${timeout / 1000} second.`))
  }, timeout)

  communicator.once(responseEvent, handler)

  return responseEvent
}

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
        this.crossOriginDriverWindows[data.origin] = source as Window
      }

      // reify any logs coming back from the cross-origin spec bridges to serialize snapshot/consoleProp DOM elements as well as select functions.
      if (LOG_EVENTS.includes(data?.event)) {
        data.data = reifyLogFromSerialization(data.data as any)
      }

      // reify the final or requested snapshot coming back from the secondary domain if requested by the runner.
      if (data?.event.includes(SNAPSHOT_EVENT_PREFIX) && !Cypress._.isEmpty(data?.data)) {
        data.data = reifySnapshotFromSerialization(data.data as any)
      }

      if (data?.data?.err) {
        data.data.err = reifySerializedError(data.data.err, this.userInvocationStack as string)
      }

      this.emit(messageName, data.data, { origin: data.origin, source, responseEvent: data.responseEvent })

      return
    }

    debug('Unexpected postMessage:', data)
  }

  /**
   * Sends an event to all spec bridge communicator instances.
   * @param {string} event - the name of the event to be sent.
   * @param {any} data - any meta data to be sent with the event.
   */
  toAllSpecBridges (event: string, data?: any) {
    debug('=> to all spec bridges', event, data)

    const preprocessedData = preprocessForSerialization<any>(data)

    // if user defined arguments are passed in, do NOT sanitize them.
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

  /**
   * Sends an event to a specific spec bridge.
   * @param origin - the origin of the spec bridge to send the event to.
   * @param event - the name of the event to be sent.
   * @param data - any meta data to be sent with the event.
   * @param responseEvent - the event to be responded with when sending back a result.
   */
  toSpecBridge (origin: string, event: string, data?: any, responseEvent?: string) {
    debug('=> to spec bridge', origin, event, data)
    const source = this.crossOriginDriverWindows[origin]

    if (source) {
      this.toSource(source, event, data, responseEvent)
    }
  }

  /**
   * Sends an event to a specific source.
   * @param source - a reference to the window object that sent the message.
   * @param event - the name of the event to be sent.
   * @param data - any meta data to be sent with the event.
   * @param responseEvent - the event to be responded with when sending back a result.
   */
  toSource (source: Window, event: string, data?: any, responseEvent?: string) {
    const preprocessedData = preprocessForSerialization<any>(data)

    // if user defined arguments are passed in, do NOT sanitize them.
    if (data?.args) {
      preprocessedData.args = data.args
    }

    // if the data has an error/err, it needs special handling for Firefox or
    // else it will end up ignored because it's not structured-cloneable
    if (data?.error) {
      preprocessedData.error = preprocessForSerialization(data.error)
    }

    if (data?.err) {
      preprocessedData.err = preprocessForSerialization(data.err)
    }

    // If there is no crossOriginDriverWindows, there is no need to send the message.
    source.postMessage({
      event,
      data: preprocessedData,
      responseEvent,
    }, '*')
  }

  /**
   * Promisified event sent from the primary communicator that expects the same event reflected back with the response.
   * @param {string} event - the name of the event to be sent.
   * @param {Cypress.ObjectLike} data - any meta data to be sent with the event.
   * @param options - contains boolean to sync globals
   * @param [timeout=1000] - in ms, if the promise does not complete during this timeout, fail the promise.
   * @returns the response from primary of the event with the same name.
   */
  toSpecBridgePromise<T> ({
    origin,
    event,
    data,
    timeout = 1000,
  }: {
    origin: string
    event: string
    data?: any
    timeout: number
  }) {
    return new Promise<T>((resolve, reject) => {
      const responseEvent = sharedPromiseSetup({
        resolve,
        reject,
        event,
        specBridgeName: origin,
        communicator: this,
        timeout,
      })

      this.toSpecBridge(origin, event, data, responseEvent)
    })
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

    this.emit(data.event, data.data, { responseEvent: data.responseEvent })
  }

  /**
   * Events to be sent to the primary communicator instance.
   * @param {string} event - the name of the event to be sent.
   * @param {Cypress.ObjectLike} data - any meta data to be sent with the event.
   * @param responseEvent - the event to be responded with when sending back a result.
   */
  toPrimary (event: string, data?: Cypress.ObjectLike, options: { syncGlobals: boolean } = { syncGlobals: false }, responseEvent?: string) {
    const { origin } = $Location.create(window.location.href)
    const eventName = `${CROSS_ORIGIN_PREFIX}${event}`

    // Preprocess logs before sending through postMessage() to attempt to serialize some DOM nodes and functions.
    if (LOG_EVENTS.includes(eventName)) {
      data = preprocessLogForSerialization(data as any)
    }

    // If requested by the runner, preprocess the snapshot before sending through postMessage() to attempt to serialize the DOM body of the snapshot.
    // NOTE: SNAPSHOT_EVENT_PREFIX events, if requested by the log manager, are namespaced per primary log
    if (eventName.includes(SNAPSHOT_EVENT_PREFIX) && !Cypress._.isEmpty(data)) {
      data = preprocessSnapshotForSerialization(data as any)
    }

    debug('<= to Primary ', event, data, origin)
    if (options.syncGlobals) this.syncGlobalsToPrimary()

    this.handleSubjectAndErr(data, (data: Cypress.ObjectLike) => {
      window.top?.postMessage({
        event: eventName,
        data,
        origin,
        responseEvent,
      }, '*')
    })
  }
  /**
   * Promisified event sent to the primary communicator that expects the same event reflected back with the response.
   * @param {string} event - the name of the event to be sent.
   * @param {Cypress.ObjectLike} data - any meta data to be sent with the event.
   * @param options - contains boolean to sync globals
   * @param [timeout=1000] - in ms, if the promise does not complete during this timeout, fail the promise.
   * @returns the response from primary of the event with the same name.
   */
  toPrimaryPromise<T> ({
    event,
    data,
    options = { syncGlobals: false },
    timeout = 1000,
  }: {
    event: string
    data?: Cypress.ObjectLike
    options: {syncGlobals: boolean}
    timeout: number
  }) {
    return new Promise<T>((resolve, reject) => {
      const responseEvent = sharedPromiseSetup({
        resolve,
        reject,
        event,
        specBridgeName: 'the primary Cypress',
        communicator: this,
        timeout,
      })

      this.toPrimary(event, data, options, responseEvent)
    })
  }
}
