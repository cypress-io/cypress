import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:browsing-context')

export class BrowsingContextModule extends AbstractModule {
  /** COMMAND METHODS */

  /**
   * activates and focuses the given top-level traversable
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-activate
   * @param {string} browserContext - the ID of the browserContext
   * @returns {undefined}
   */
  async activate (browserContext: string) {
    const payload: Bidi.BrowsingContext.Activate = {
      method: 'browsingContext.activate',
      params: {
        context: browserContext,
      },
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Activate, void>(payload)
    } catch (e) {
      debug(`failed to activate browsing context: ${e}`)
      throw e
    }
  }

  /**
   * captures an image of the given navigable, and returns it as a Base64-encoded string
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-captureScreenshot
   * @param {Bidi.BrowsingContext.CaptureScreenshotParameters} screenshotParams - params needed to take a screenshot. Context ID is required
   * @returns {Bidi.BrowsingContext.CaptureScreenshotResult} - the screenshot data in a base64-encoded string
   */
  async captureScreenshot (screenshotParams: Bidi.BrowsingContext.CaptureScreenshotParameters) {
    const payload: Bidi.BrowsingContext.CaptureScreenshot = {
      method: 'browsingContext.captureScreenshot',
      params: screenshotParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.CaptureScreenshot, Bidi.BrowsingContext.CaptureScreenshotResult>(payload)

      return result
    } catch (e) {
      debug(`failed to capture browsing context screenshot: ${e}`)
      throw e
    }
  }

  /**
   * closes a top-level traversable
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-close
   * @param {Bidi.BrowsingContext.CloseParameters} closeParams - params needed to close a context. Context ID is required
   * @returns {undefined}
   */
  async close (closeParams: Bidi.BrowsingContext.CloseParameters) {
    const payload: Bidi.BrowsingContext.Close = {
      method: 'browsingContext.close',
      params: closeParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Close, void>(payload)
    } catch (e) {
      debug(`failed to close browsing context: ${e}`)
      throw e
    }
  }

  /**
   * creates a new navigable, either in a new tab or in a new window, and returns its navigable id
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-create
   * @param {Bidi.BrowsingContext.CreateParameters} createParams - params needed to create a context. Type ('window' | 'tab') is required
   * @returns {Bidi.BrowsingContext.CreateResult} the created context
   */
  async create (createParams: Bidi.BrowsingContext.CreateParameters) {
    const payload: Bidi.BrowsingContext.Create = {
      method: 'browsingContext.create',
      params: createParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Create, Bidi.BrowsingContext.CreateResult>(payload)

      return result
    } catch (e) {
      debug(`failed to create browsing context: ${e}`)
      throw e
    }
  }

  /**
   * returns a tree of all descendent navigables including the given parent itself, or all top-level contexts when no parent is provided
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-getTree
   * @param {Bidi.BrowsingContext.GetTreeParameters} getTreeParams - params needed to get the tree. Can specify a context root optionally
   * @returns {Bidi.BrowsingContext.GetTreeResult} the tree of contexts
   */
  async getTree (getTreeParams: Bidi.BrowsingContext.GetTreeParameters) {
    const payload: Bidi.BrowsingContext.GetTree = {
      method: 'browsingContext.getTree',
      params: getTreeParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.GetTree, Bidi.BrowsingContext.GetTreeResult>(payload)

      return result
    } catch (e) {
      debug(`failed to get browsing context tree: ${e}`)
      throw e
    }
  }

  /**
   * allows closing an open prompt
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-handleUserPrompt
   * @param {Bidi.BrowsingContext.HandleUserPromptParameters} handleUserPromptParameters - params needed to get the tree. Context ID is required
   * @returns {undefined}
   */
  async handleUserPrompt (handleUserPromptParams: Bidi.BrowsingContext.HandleUserPromptParameters) {
    const payload: Bidi.BrowsingContext.HandleUserPrompt = {
      method: 'browsingContext.handleUserPrompt',
      params: handleUserPromptParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.BrowsingContext.HandleUserPrompt, void>(payload)
    } catch (e) {
      debug(`failed to handle browsing context user prompt: ${e}`)
      throw e
    }
  }

  /**
   * returns a list of all nodes matching the specified locator.
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-locateNodes
   * @param {Bidi.BrowsingContext.LocateNodesParameters} locateNodesParams - params needed to locate nodes. Context ID and locator are required
   * @returns {Bidi.BrowsingContext.LocateNodesResult} Nodes located
   */
  async locateNodes (locateNodesParams: Bidi.BrowsingContext.LocateNodesParameters) {
    const payload: Bidi.BrowsingContext.LocateNodes = {
      method: 'browsingContext.locateNodes',
      params: locateNodesParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.LocateNodes, Bidi.BrowsingContext.LocateNodesResult>(payload)

      return result
    } catch (e) {
      debug(`failed to locate browsing context nodes: ${e}`)
      throw e
    }
  }

  /**
   * navigates a navigable to the given URL.
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-navigate
   * @param {Bidi.BrowsingContext.NavigateParameters} navigateParams - navigate a given context to a url. Context ID and locator are required
   * @returns {Bidi.BrowsingContext.NavigateResult} results of the navigation
   */
  async navigate (navigateParams: Bidi.BrowsingContext.NavigateParameters) {
    const payload: Bidi.BrowsingContext.Navigate = {
      method: 'browsingContext.navigate',
      params: navigateParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Navigate, Bidi.BrowsingContext.NavigateResult>(payload)

      return result
    } catch (e) {
      debug(`failed to navigate browsing context: ${e}`)
      throw e
    }
  }

  /**
   * creates a paginated representation of a document, and returns it as a PDF document represented as a Base64-encoded string.
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-print
   * @param {Bidi.BrowsingContext.PrintParameters} printParams - params to print the context. Context ID is required
   * @returns {Bidi.BrowsingContext.PrintResult} the print PDF data in a base64-encoded string
   */
  async print (printParams: Bidi.BrowsingContext.PrintParameters) {
    const payload: Bidi.BrowsingContext.Print = {
      method: 'browsingContext.print',
      params: printParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Print, Bidi.BrowsingContext.PrintResult>(payload)

      return result
    } catch (e) {
      debug(`failed to print browsing context: ${e}`)
      throw e
    }
  }

  /**
   * reloads a navigable
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-reload
   * @param {Bidi.BrowsingContext.ReloadParameters} reloadParams - params to print the context. Context ID is required
   * @returns {Bidi.BrowsingContext.NavigateResult} the result of the reload
   */
  async reload (reloadParams: Bidi.BrowsingContext.ReloadParameters) {
    const payload: Bidi.BrowsingContext.Reload = {
      method: 'browsingContext.reload',
      params: reloadParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.Reload, Bidi.BrowsingContext.NavigateResult>(payload)

      return result
    } catch (e) {
      debug(`failed to reload browsing context: ${e}`)
      throw e
    }
  }

  /**
   * modifies specific viewport characteristics (e.g. viewport width and viewport height) on the given top-level traversable
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-setViewport
   * @param {Bidi.BrowsingContext.SetViewportParameters} setViewportParams params to set the viewport. Context ID is required
   * @returns {undefined}
   */
  async setViewport (setViewportParams: Bidi.BrowsingContext.SetViewportParameters) {
    const payload: Bidi.BrowsingContext.SetViewport = {
      method: 'browsingContext.setViewport',
      params: setViewportParams,
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.BrowsingContext.SetViewport, void>(payload)
    } catch (e) {
      debug(`failed to set viewport of browsing context: ${e}`)
      throw e
    }
  }

  /**
   * traverses the history of a given navigable by a delta
   * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-traverseHistory
   * @param {Bidi.BrowsingContext.TraverseHistoryParameters} traverseHistoryParams - params to traverse history. Context ID and delta are required
   * @returns {Bidi.BrowsingContext.TraverseHistoryResult} a key-value pair of the history result
   */
  async traverseHistory (traverseHistoryParams: Bidi.BrowsingContext.TraverseHistoryParameters) {
    const payload: Bidi.BrowsingContext.TraverseHistory = {
      method: 'browsingContext.traverseHistory',
      params: traverseHistoryParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.BrowsingContext.TraverseHistory, Bidi.BrowsingContext.TraverseHistoryResult>(payload)

      return result
    } catch (e) {
      debug(`failed to set viewport of browsing context: ${e}`)
      throw e
    }
  }

  /** EVENT METHODS */

  /**
   * Listens for the 'browsingContext.contextCreated' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-contextCreated
   * @param callback - the callback function invoked when the 'browsingContext.contextCreated' event is called
   */
  onContextCreated<T> (callback: (params: Bidi.BrowsingContext.ContextCreated) => T) {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.ContextCreated, T>('browsingContext.contextCreated', callback)
  }

  /**
   * Listens for the 'browsingContext.contextDestroyed' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-contextDestroyed
   * @param callback - the callback function invoked when the 'browsingContext.contextDestroyed' event is called
   */
  onContextDestroyed<T> (callback: (params: Bidi.BrowsingContext.ContextDestroyed) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.ContextDestroyed, T>('browsingContext.contextDestroyed', callback)
  }

  /**
   * Listens for the 'browsingContext.navigationStarted' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-navigationStarted
   * @param callback - the callback function invoked when the 'browsingContext.navigationStarted' event is called
   */
  onNavigationStarted<T> (callback: (params: Bidi.BrowsingContext.NavigationStarted) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.NavigationStarted, T>('browsingContext.navigationStarted', callback)
  }

  /**
   * Listens for the 'browsingContext.fragmentNavigated' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-fragmentNavigated
   * @param callback - the callback function invoked when the 'browsingContext.fragmentNavigated' event is called
   */
  onFragmentNavigated<T> (callback: (params: Bidi.BrowsingContext.FragmentNavigated) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.FragmentNavigated, T>('browsingContext.fragmentNavigated', callback)
  }

  /**
   * Listens for the 'browsingContext.domContentLoaded' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-domContentLoaded
   * @param callback - the callback function invoked when the 'browsingContext.domContentLoaded' event is called
   */
  onDomContentLoaded<T> (callback: (params: Bidi.BrowsingContext.DomContentLoaded) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.DomContentLoaded, T>('browsingContext.domContentLoaded', callback)
  }

  /**
   * Listens for the 'browsingContext.load' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-load
   * @param callback - the callback function invoked when the 'browsingContext.load' event is called
   */
  onLoad<T> (callback: (params: Bidi.BrowsingContext.Load) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.Load, T>('browsingContext.load', callback)
  }

  /**
   * Listens for the 'browsingContext.downloadWillBegin' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-downoadWillBegin (yes the link is spelled wrong)
   * @param callback - the callback function invoked when the 'browsingContext.downloadWillBegin' event is called
   */
  onDownloadWillBegin<T> (callback: (params: Bidi.BrowsingContext.DownloadWillBegin) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.DownloadWillBegin, T>('browsingContext.downloadWillBegin', callback)
  }

  /**
   * Listens for the 'browsingContext.navigationAborted' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-navigationAborted
   * @param callback - the callback function invoked when the 'browsingContext.navigationAborted' event is called
   */
  onNavigationAborted<T> (callback: (params: Bidi.BrowsingContext.NavigationAborted) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.NavigationAborted, T>('browsingContext.navigationAborted', callback)
  }

  /**
   * Listens for the 'browsingContext.navigationFailed' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-navigationFailed
   * @param callback - the callback function invoked when the 'browsingContext.navigationAborted' event is called
   */
  onNavigationFailed<T> (callback: (params: Bidi.BrowsingContext.NavigationFailed) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.NavigationFailed, T>('browsingContext.navigationFailed', callback)
  }

  /**
   * Listens for the 'browsingContext.userPromptClosed' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-userPromptClosed
   * @param callback - the callback function invoked when the 'browsingContext.userPromptClosed' event is called
   */
  onUserPromptClosed<T> (callback: (params: Bidi.BrowsingContext.UserPromptClosed) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.UserPromptClosed, T>('browsingContext.userPromptClosed', callback)
  }

  /**
   * Listens for the 'browsingContext.userPromptOpened' event
   * @see https://w3c.github.io/webdriver-bidi/#event-browsingContext-userPromptOpened
   * @param callback - the callback function invoked when the 'browsingContext.userPromptOpened' event is called
   */
  onUserPromptOpened<T> (callback: (params: Bidi.BrowsingContext.UserPromptOpened) => T): void {
    this._bidiSocket.bindEvent<Bidi.BrowsingContext.UserPromptOpened, T>('browsingContext.userPromptOpened', callback)
  }
}
