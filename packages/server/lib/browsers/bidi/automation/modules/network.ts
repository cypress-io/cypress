// import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

// const debug = debugModule('cypress:server:browsers:bidi:automation:modules:network')

export class NetworkModule extends AbstractModule {
  /**
   * Listens for the 'network.authRequired' event
   * @see https://w3c.github.io/webdriver-bidi/#event-network-authRequired
   * @param callback - the callback function invoked when the 'network.authRequired' event is called
   */
  onAuthRequired<T> (callback: (params: Bidi.Network.AuthRequired) => T) {
    this._bidiSocket.bindEvent<Bidi.Network.AuthRequired, T>('network.authRequired', callback)
  }

  /**
   * Listens for the 'network.beforeSendRequest' event
   * @see https://w3c.github.io/webdriver-bidi/#event-network-beforeSendRequest
   * @param callback - the callback function invoked when the 'network.beforeSendRequest' event is called
   */
  onBeforeRequestSent<T> (callback: (params: Bidi.Network.BeforeRequestSent) => T) {
    this._bidiSocket.bindEvent<Bidi.Network.BeforeRequestSent, T>('network.beforeSendRequest', callback)
  }

  /**
   * Listens for the 'network.fetchError' event
   * @see https://w3c.github.io/webdriver-bidi/#event-network-fetchError
   * @param callback - the callback function invoked when the 'network.fetchError' event is called
   */
  onFetchError<T> (callback: (params: Bidi.Network.FetchError) => T) {
    this._bidiSocket.bindEvent<Bidi.Network.FetchError, T>('network.fetchError', callback)
  }

  /**
   * Listens for the 'network.responseCompleted' event
   * @see https://w3c.github.io/webdriver-bidi/#event-network-responseCompleted
   * @param callback - the callback function invoked when the 'network.responseCompleted' event is called
   */
  onResponseComplete<T> (callback: (params: Bidi.Network.ResponseCompleted) => T) {
    this._bidiSocket.bindEvent<Bidi.Network.ResponseCompleted, T>('network.responseCompleted', callback)
  }

  /**
   * Listens for the 'network.responseStarted' event
   * @see https://w3c.github.io/webdriver-bidi/#event-network-responseStarted
   * @param callback - the callback function invoked when the 'network.responseStarted' event is called
   */
  onResponseStarted<T> (callback: (params: Bidi.Network.ResponseStarted) => T) {
    this._bidiSocket.bindEvent<Bidi.Network.ResponseStarted, T>('network.responseStarted', callback)
  }
}
