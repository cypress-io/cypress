import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:input')

export class InputModule extends AbstractModule {
  /**
   * performs a specified sequence of user input actions
   * @see https://w3c.github.io/webdriver-bidi/#command-input-performActions
   * @param {Bidi.Input.PerformActionsParameters} performActionsParams - perform actions parameters. Requires a context ID and a list of actions
   * @returns {undefined}
   */
  async performActions (performActionsParams: Bidi.Input.PerformActionsParameters) {
    const payload: Bidi.Input.PerformActions = {
      method: 'input.performActions',
      params: performActionsParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Input.PerformActions, void>(payload)
    } catch (e) {
      debug(`failed to perform input actions: ${e}`)
      throw e
    }
  }

  /**
   * resets the input state associated with the current session
   * @see https://w3c.github.io/webdriver-bidi/#command-input-releaseActions
   * @param {Bidi.Input.ReleaseActionsParameters} releaseActionsParams- release action parameters. Requires a context ID
   * @returns {undefined}
   */
  async releaseActions (releaseActionsParams: Bidi.Input.ReleaseActionsParameters) {
    const payload: Bidi.Input.ReleaseActions = {
      method: 'input.releaseActions',
      params: releaseActionsParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Input.ReleaseActions, void>(payload)
    } catch (e) {
      debug(`failed to release input actions: ${e}`)
      throw e
    }
  }

  /**
   * sets the files property of a given input element with type file to a set of file paths
   * @see https://w3c.github.io/webdriver-bidi/#command-input-setFiles
   * @param {Bidi.Input.SetFilesParameters} setFilesParams - set files parameters. Requires a context ID, an element, and files in text to be set
   * @returns {undefined}
   */
  async setFiles (setFilesParams: Bidi.Input.SetFilesParameters) {
    const payload: Bidi.Input.SetFiles = {
      method: 'input.setFiles',
      params: setFilesParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Input.SetFiles, void>(payload)
    } catch (e) {
      debug(`failed to set input files: ${e}`)
      throw e
    }
  }
}
