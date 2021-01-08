export { minimatch } from './Minimatch'

export interface CypressStatic {
  /**
   * Lodash library
   *
   * @see https://on.cypress.io/_
   * @example
   *    Cypress._.keys(obj)
   */
  _: _.LoDashStatic
  /**
   * jQuery library
   *
   * @see https://on.cypress.io/$
   * @example
   *    Cypress.$('p')
   */
  $: JQueryStatic
  /**
   * Cypress automatically includes a Blob library and exposes it as Cypress.Blob.
   *
   * @see https://on.cypress.io/blob
   * @see https://github.com/nolanlawson/blob-util
   * @example
   *    Cypress.Blob.method()
   */
  Blob: BlobUtil.BlobUtilStatic
  /**
   * Cypress automatically includes minimatch and exposes it as Cypress.minimatch.
   *
   * @see https://on.cypress.io/minimatch
   */
  minimatch: typeof minimatch
  /**
   * @deprecated Will be removed in a future version.
   * Consider including your own datetime formatter in your tests.
   *
   * Cypress automatically includes moment.js and exposes it as Cypress.moment.
   *
   * @see https://on.cypress.io/moment
   * @see http://momentjs.com/
   * @example
   *    const todaysDate = Cypress.moment().format("MMM DD, YYYY")
   */
  moment: Moment.MomentStatic
  /**
   * Cypress automatically includes Bluebird and exposes it as Cypress.Promise.
   *
   * @see https://on.cypress.io/promise
   * @see https://github.com/petkaantonov/bluebird
   * @example
   *   new Cypress.Promise((resolve, reject) => { ... })
   */
  Promise: Bluebird.BluebirdStatic
  /**
   * Cypress includes Sinon.js library used in `cy.spy` and `cy.stub`.
   *
   * @see https://sinonjs.org/
   * @see https://on.cypress.io/stubs-spies-and-clocks
   * @see https://example.cypress.io/commands/spies-stubs-clocks
   */
  sinon: sinon.SinonStatic

  /**
   * Cypress version string. i.e. "1.1.2"
   * @see https://on.cypress.io/version
   * @example
    ```
    expect(Cypress.version).to.be.a('string')
    if (Cypress.version === '1.2.0') {
      // test something specific
    }
    ```
   */
  version: string

  /**
   * OS platform name, from Node `os.platform()`
   *
   * @see https://nodejs.org/api/os.html#os_os_platform
   * @example
   *    Cypress.platform // "darwin"
   */
  platform: string

  /**
   * CPU architecture, from Node `os.arch()`
   *
   * @see https://nodejs.org/api/os.html#os_os_arch
   * @example
   *    Cypress.arch // "x64"
   */
  arch: string

  /**
   * Currently executing spec file.
   * @example
  ```
  Cypress.spec
  // {
  //  name: "config_passing_spec.coffee",
  //  relative: "cypress/integration/config_passing_spec.coffee",
  //  absolute: "/users/smith/projects/web/cypress/integration/config_passing_spec.coffee"
  //  specType: "integration"
  // }
  ```
   */
  spec: CypressSpec

  /**
   * Information about the browser currently running the tests
   */
  browser: Browser

  /**
   * Internal class for LocalStorage management.
   */
  LocalStorage: LocalStorage

  /**
   * Fire automation:request event for internal use.
   */
  automation(eventName: string, ...args: any[]): Promise<any>

  /**
   * Promise wrapper for certain internal tasks.
   */
  backend: Backend

  /**
   * Returns all configuration objects.
   * @see https://on.cypress.io/config
   * @example
  ```
  Cypress.config()
  // {defaultCommandTimeout: 10000, pageLoadTimeout: 30000, ...}
  ```
   */
  config(): ResolvedConfigOptions
  /**
   * Returns one configuration value.
   * @see https://on.cypress.io/config
   * @example
  ```
  Cypress.config('pageLoadTimeout')
  // 60000
  ```
   */
  config<K extends keyof ConfigOptions>(key: K): ResolvedConfigOptions[K]
  /**
   * Sets one configuration value.
   * @see https://on.cypress.io/config
   * @example
  ```
  Cypress.config('viewportWidth', 800)
  ```
   */
  config<K extends keyof ConfigOptions>(key: K, value: ResolvedConfigOptions[K]): void
  /**
   * Sets multiple configuration values at once.
   * @see https://on.cypress.io/config
   * @example
  ```
  Cypress.config({
    defaultCommandTimeout: 10000,
    viewportHeight: 900
  })
  ```
   */
  config(Object: ConfigOptions): void

  // no real way to type without generics
  /**
   * Returns all environment variables set with CYPRESS_ prefix or in "env" object in "cypress.json"
   *
   * @see https://on.cypress.io/env
   */
  env(): ObjectLike
  /**
   * Returns specific environment variable or undefined
   * @see https://on.cypress.io/env
   * @example
   *    // cypress.json
   *    { "env": { "foo": "bar" } }
   *    Cypress.env("foo") // => bar
   */
  env(key: string): any
  /**
   * Set value for a variable.
   * Any value you change will be permanently changed for the remainder of your tests.
   * @see https://on.cypress.io/env
   * @example
   *    Cypress.env("host", "http://server.dev.local")
   */
  env(key: string, value: any): void
  /**
   * Set values for multiple variables at once. Values are merged with existing values.
   * @see https://on.cypress.io/env
   * @example
   *    Cypress.env({ host: "http://server.dev.local", foo: "foo" })
   */
  env(object: ObjectLike): void

  /**
   * Firefox only: Get the current number of tests that will run between forced garbage collections.
   *
   * Returns undefined if not in Firefox, returns a null or 0 if forced GC is disabled.
   *
   * @see https://on.cypress.io/firefox-gc-issue
   */
  getFirefoxGcInterval(): number | null | undefined

  /**
   * @returns the number of test retries currently enabled for the run
   */
  getTestRetries(): number | null

  /**
   * Checks if a variable is a valid instance of `cy` or a `cy` chainable.
   *
   * @see https://on.cypress.io/iscy
   * @example
   *    Cypress.isCy(cy) // => true
   */
  isCy<TSubject = any>(obj: Chainable<TSubject>): obj is Chainable<TSubject>
  isCy(obj: any): obj is Chainable

  /**
   * Returns true if currently running the supplied browser name or matcher object. Also accepts an array of matchers.
   * @example isBrowser('chrome') will be true for the browser 'chrome:canary' and 'chrome:stable'
   * @example isBrowser({ name: 'firefox', channel: 'dev' }) will be true only for the browser 'firefox:dev' (Firefox Developer Edition)
   * @example isBrowser(['firefox', 'edge']) will be true only for the browsers 'firefox' and 'edge'
   * @example isBrowser('!firefox') will be true for every browser other than 'firefox'
   * @example isBrowser({ family: '!chromium'}) will be true for every browser not matching { family: 'chromium' }
   * @param matcher browser name or matcher object to check.
   */
  isBrowser(name: IsBrowserMatcher): boolean

  /**
   * Internal options for "cy.log" used in custom commands.
   *
   * @see https://on.cypress.io/cypress-log
   */
  log(options: Partial<LogConfig>): Log

  /**
   * @see https://on.cypress.io/api/commands
   */
  Commands: {
    add(name: string, fn: (...args: any[]) => CanReturnChainable): void
    add(name: string, options: CommandOptions, fn: (...args: any[]) => CanReturnChainable): void
    overwrite(name: string, fn: (...args: any[]) => CanReturnChainable): void
  }

  /**
   * @see https://on.cypress.io/cookies
   */
  Cookies: {
    debug(enabled: boolean, options?: Partial<DebugOptions>): void
    preserveOnce(...names: string[]): void
    defaults(options: Partial<CookieDefaults>): void
  }

  /**
   * @see https://on.cypress.io/dom
   */
  dom: {
    /**
     * Returns a jQuery object obtained by wrapping an object in jQuery.
     */
    wrap(wrappingElement_function: JQuery.Selector | JQuery.htmlString | Element | JQuery | ((index: number) => string | JQuery)): JQuery
    query(selector: JQuery.Selector, context?: Element | JQuery): JQuery
    /**
     * Returns an array of raw elements pulled out from a jQuery object.
     */
    unwrap(obj: any): any
    /**
     * Returns a boolean indicating whether an object is a DOM object.
     */
    isDom(obj: any): boolean
    isType(element: JQuery | HTMLElement, type: string): boolean
    /**
     * Returns a boolean indicating whether an element is visible.
     */
    isVisible(element: JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether an element is hidden.
     */
    isHidden(element: JQuery | HTMLElement, methodName?: string, options?: object): boolean
    /**
     * Returns a boolean indicating whether an element can receive focus.
     */
    isFocusable(element: JQuery | HTMLElement): boolean
    isTextLike(element: JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether an element is scrollable.
     */
    isScrollable(element: Window | JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether an element currently has focus.
     */
    isFocused(element: JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether an element is detached from the DOM.
     */
    isDetached(element: JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether an element is attached to the DOM.
     */
    isAttached(element: JQuery | HTMLElement | Window | Document): boolean
    isSelector(element: JQuery | HTMLElement, selector: JQuery.Selector): boolean
    /**
     * Returns a boolean indicating whether an element is a descendent of another element.
     */
    isDescendent(element1: JQuery | HTMLElement, element2: JQuery | HTMLElement): boolean
    /**
     * Returns a boolean indicating whether object is undefined or html, body, or document.
     */
    isUndefinedOrHTMLBodyDoc(obj: any): boolean
    /**
     * Returns a boolean indicating whether an object is a DOM element.
     */
    isElement(obj: any): boolean
    /**
     * Returns a boolean indicating whether a node is of document type.
     */
    isDocument(obj: any): boolean
    /**
     * Returns a boolean indicating whether an object is a window object.
     */
    isWindow(obj: any): obj is Window
    /**
     * Returns a boolean indicating whether an object is a jQuery object.
     */
    isJquery(obj: any): obj is JQuery
    isInputType(element: JQuery | HTMLElement, type: string | string[]): boolean
    stringify(element: JQuery | HTMLElement, form: string): string
    getElements(element: JQuery): JQuery | HTMLElement[]
    getContainsSelector(text: string, filter?: string): JQuery.Selector
    getFirstDeepestElement(elements: HTMLElement[], index?: number): HTMLElement
    getWindowByElement(element: JQuery | HTMLElement): JQuery | HTMLElement
    getReasonIsHidden(element: JQuery | HTMLElement, options?: object): string
    getFirstScrollableParent(element: JQuery | HTMLElement): JQuery | HTMLElement
    getFirstFixedOrStickyPositionParent(element: JQuery | HTMLElement): JQuery | HTMLElement
    getFirstStickyPositionParent(element: JQuery | HTMLElement): JQuery | HTMLElement
    getCoordsByPosition(left: number, top: number, xPosition?: string, yPosition?: string): number
    getElementPositioning(element: JQuery | HTMLElement): ElementPositioning
    getElementAtPointFromViewport(doc: Document, x: number, y: number): Element | null
    getElementCoordinatesByPosition(element: JQuery | HTMLElement, position: string): ElementCoordinates
    getElementCoordinatesByPositionRelativeToXY(element: JQuery | HTMLElement, x: number, y: number): ElementPositioning
  }

  /**
   * @see https://on.cypress.io/api/api-server
   */
  Server: {
    defaults(options: Partial<ServerOptions>): void
  }

  /**
   * @see https://on.cypress.io/screenshot-api
   */
  Screenshot: {
    defaults(options: Partial<ScreenshotDefaultsOptions>): void
  }

  /**
   * These events come from Cypress as it issues commands and reacts to their state. These are all useful to listen to for debugging purposes.
   * @see https://on.cypress.io/catalog-of-events#App-Events
   */
  on: Actions

  /**
   * These events come from Cypress as it issues commands and reacts to their state. These are all useful to listen to for debugging purposes.
   * @see https://on.cypress.io/catalog-of-events#App-Events
   */
  once: Actions

  /**
   * These events come from Cypress as it issues commands and reacts to their state. These are all useful to listen to for debugging purposes.
   * @see https://on.cypress.io/catalog-of-events#App-Events
   */
  off: Actions
}
