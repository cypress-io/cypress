// import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

// const debug = debugModule('cypress:server:browsers:bidi:automation:modules:log')

export class LogModule extends AbstractModule {
  /**
   * Listens for the 'log.entryAdded' event
   * @see https://w3c.github.io/webdriver-bidi/#event-log-entryAdded
   * @param callback - the callback function invoked when the 'log.entryAdded' event is called
   */
  onEntryAdded<T> (callback: (params: Bidi.Log.EntryAdded) => T) {
    this._bidiSocket.bindEvent<Bidi.Log.EntryAdded, T>('log.entryAdded', callback)
  }
}
