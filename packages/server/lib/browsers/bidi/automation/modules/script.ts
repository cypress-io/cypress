import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:script')

export class ScriptModule extends AbstractModule {
  /** COMMAND METHODS */

  /**
   * adds a preload script
   * @see https://w3c.github.io/webdriver-bidi/#command-script-addPreloadScript
   * @param {Bidi.Script.AddPreloadScriptParameters} addPreloadScriptParams - preload script parameters. Requires a stringified function
   * @returns {Bidi.Script.AddPreloadScriptResult} handle to a script that will run on realm creation
   */
  async addPreloadScript (addPreloadScriptParams: Bidi.Script.AddPreloadScriptParameters) {
    const payload: Bidi.Script.AddPreloadScript = {
      method: 'script.addPreloadScript',
      params: addPreloadScriptParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Script.AddPreloadScript, Bidi.Script.AddPreloadScriptResult>(payload)

      return result
    } catch (e) {
      debug(`failed to add preload script: ${e}`)
      throw e
    }
  }

  /**
   * disowns the given handles. This does not guarantee the handled object will be garbage collected, as there can be other handles or strong ECMAScript references.
   * @see https://w3c.github.io/webdriver-bidi/#command-script-disown
   * @param {Bidi.Script.DisownParameters} disownParams - disown script parameters. Requires the handle references and a script target
   * @returns {undefined}
   */
  async disown (disownParams: Bidi.Script.DisownParameters) {
    const payload: Bidi.Script.Disown = {
      method: 'script.disown',
      params: disownParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Script.Disown, void>(payload)
    } catch (e) {
      debug(`failed to disown script: ${e}`)
      throw e
    }
  }

  /**
   * calls a provided function with given arguments in a given realm
   * @see https://w3c.github.io/webdriver-bidi/#command-script-callFunction
   * @param {Bidi.Script.CallFunctionParameters} callFunctionParameters - call function parameters. Requires a stringified function, a target, and if the result should be awaited
   * @returns {Bidi.Script.EvaluateResult} Whether the evaluate was successful or not
   */
  async callFunction (callFunctionParameters: Bidi.Script.CallFunctionParameters) {
    const payload: Bidi.Script.CallFunction = {
      method: 'script.callFunction',
      params: callFunctionParameters,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Script.CallFunction, Bidi.Script.EvaluateResult>(payload)

      return result
    } catch (e) {
      debug(`failed to call script function: ${e}`)
      throw e
    }
  }

  /**
   * evaluates a provided script in a given realm. For convenience a navigable can be provided in place of a realm, in which case the realm used is the realm of the browsing context’s active document.
   *
   * The method returns the value of executing the provided script, unless it returns a promise and awaitPromise is true, in which case the resolved value of the promise is returned.
   * @see https://w3c.github.io/webdriver-bidi/#command-script-evaluate
   * @param {Bidi.Script.EvaluateParameters} evaluateParams - evaluate parameters. Requires a stringified expression, a target, and if the result should be awaited
   * @returns {Bidi.Script.EvaluateResult} Whether the evaluate was successful or not
   */
  async evaluate (evaluateParams: Bidi.Script.EvaluateParameters) {
    const payload: Bidi.Script.Evaluate = {
      method: 'script.evaluate',
      params: evaluateParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Script.Evaluate, Bidi.Script.EvaluateResult>(payload)

      return result
    } catch (e) {
      debug(`failed to evaluate script: ${e}`)
      throw e
    }
  }

  /**
   * returns a list of all realms, optionally filtered to realms of a specific type, or to the realm associated with a navigable's active document
   * @see https://w3c.github.io/webdriver-bidi/#command-script-getRealms
   * @param {Bidi.Script.GetRealmsParameters} getRealmsParameters - get realms parameters. Type and context ID are optional
   * @returns {Bidi.Script.GetRealmsResult} the returned realms
   */
  async getRealms (getRealmsParameters: Bidi.Script.GetRealmsParameters) {
    const payload: Bidi.Script.GetRealms = {
      method: 'script.getRealms',
      params: getRealmsParameters,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Script.GetRealms, Bidi.Script.GetRealmsResult>(payload)

      return result
    } catch (e) {
      debug(`failed to get script realms: ${e}`)
      throw e
    }
  }

  /**
   * removes a preload script
   * @see https://w3c.github.io/webdriver-bidi/#command-script-removePreloadScript
   * @param {Bidi.Script.RemovePreloadScriptParameters} removePreloadScriptParams - remove preload script parameters. Preload script to remove is required
   * @returns {undefined}
   */
  async removePreloadScript (removePreloadScriptParams: Bidi.Script.RemovePreloadScriptParameters) {
    const payload: Bidi.Script.RemovePreloadScript = {
      method: 'script.removePreloadScript',
      params: removePreloadScriptParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Script.RemovePreloadScript, void>(payload)
    } catch (e) {
      debug(`failed to remove preload script: ${e}`)
      throw e
    }
  }

  /** EVENT METHODS */

  /**
   * Listens for the 'script.message' event
   * @see https://w3c.github.io/webdriver-bidi/#event-script-message
   * @param callback - the callback function invoked when the 'script.message' event is called
   */
  onScriptMessage<T> (callback: (params: Bidi.Script.Message) => T) {
    this._bidiSocket.bindEvent<Bidi.Script.Message, T>('script.message', callback)
  }

  /**
   * Listens for the 'script.realmCreated' event
   * @see https://w3c.github.io/webdriver-bidi/#event-script-realmCreated
   * @param callback - the callback function invoked when the 'script.realmCreated' event is called
   */
  onRealmCreated<T> (callback: (params: Bidi.Script.RealmCreated) => T) {
    this._bidiSocket.bindEvent<Bidi.Script.RealmCreated, T>('script.realmCreated', callback)
  }

  /**
   * Listens for the 'script.realmDestroyed' event
   * @see https://w3c.github.io/webdriver-bidi/#event-script-realmDestroyed
   * @param callback - the callback function invoked when the 'script.realmDestroyed' event is called
   */
  onRealmDestroyed<T> (callback: (params: Bidi.Script.RealmDestroyed) => T) {
    this._bidiSocket.bindEvent<Bidi.Script.RealmDestroyed, T>('script.realmDestroyed', callback)
  }
}
