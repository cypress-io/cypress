// Project: https://www.cypress.io
// GitHub:  https://github.com/cypress-io/cypress
// Definitions by: Gert Hengeveld <https://github.com/ghengeveld>
//                 Mike Woudenberg <https://github.com/mikewoudenberg>
//                 Robbert van Markus <https://github.com/rvanmarkus>
//                 Nicholas Boll <https://github.com/nicholasboll>
// TypeScript Version: 2.5
// Updated by the Cypress team: https://www.cypress.io/about/

/// <reference types="lodash" />
/// <reference types="jquery" />
/// <reference types="blob-util" />
/// <reference types="minimatch" />
/// <reference types="bluebird" />
/// <reference types="sinon" />

declare namespace Cypress {
  type FileContents = string | any[] | object
  type HistoryDirection = "back" | "forward"
  type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT"
  type RequestBody = string | object
  type ViewportOrientation = "portrait" | "landscape"
  type PrevSubject = "optional" | "element" | "document" | "window"

  interface   CommandOptions {
    prevSubject: boolean | PrevSubject | PrevSubject[]
  }
  interface ObjectLike {
    [key: string]: any
  }

  /**
   * Several libraries are bundled with Cypress by default.
   *
   * @see https://on.cypress.io/api
   */
  interface Cypress {
    /**
     * Lodash library
     *
     * @see https://on.cypress.io/_
     * @example _
     * ```ts
     * Cypress._.keys(obj)
     * ```
     */
    _: _.LoDashStatic
    /**
     * jQuery library
     *
     * @see https://on.cypress.io/$
     * @example $
     * ```ts
     * Cypress.$('p')
     * ```
     */
    $: JQueryStatic
    /**
     * Cypress automatically includes a Blob library and exposes it as Cypress.Blob.
     *
     * @see https://on.cypress.io/blob
     * @see https://github.com/nolanlawson/blob-util
     * @example Blob
     * ```ts
     * Cypress.Blob.method()
     * ```
     */
    Blob: BlobUtil.BlobUtilStatic
    /**
     * Cypress automatically includes minimatch and exposes it as Cypress.minimatch.
     *
     * @see https://on.cypress.io/minimatch
     */
    minimatch: Mimimatch.MimimatchStatic
    /**
     * Cypress automatically includes moment.js and exposes it as Cypress.moment.
     *
     * @see https://on.cypress.io/moment
     * @see http://momentjs.com/
     * @example moment
     * ```ts
     * const todaysDate = Cypress.moment().format("MMM DD, YYYY")
     * ```
     */
    moment: (...args: any[]) => any // perhaps we want to add moment as a dependency for types?
    /**
     * Cypress automatically includes Bluebird and exposes it as Cypress.Promise.
     *
     * @see https://on.cypress.io/promise
     * @see https://github.com/petkaantonov/bluebird
     * @example Promise
     * ```ts
     * new Cypress.Promise((resolve, reject) => { ... })
     * ```
     */
    Promise: Bluebird.BluebirdStatic
    /**
     * Cypress version string. i.e. "1.1.2"
     */
    version: string

    /**
     * OS platform name, from Node `os.platform()`
     *
     * @see https://nodejs.org/api/os.html#os_os_platform
     * @example platform
     * ```ts
     * Cypress.platform // "darwin"
     * ```
     */
    platform: string

    /**
     * CPU architecture, from Node `os.arch()`
     *
     * @see https://nodejs.org/api/os.html#os_os_arch
     * @example arch
     * ```ts
     * Cypress.arch // "x64"
     * ```
     */
    arch: string

    /**
     * @see https://on.cypress.io/config
     */
    config(): ConfigOptions
    config<K extends keyof ConfigOptions>(key: K): ConfigOptions[K]
    config<K extends keyof ConfigOptions>(key: K, value: ConfigOptions[K]): void
    config(Object: Partial<ConfigOptions>): void

    // no real way to type without generics
    /**
     * @see https://on.cypress.io/env
     */
    env(): ObjectLike
    env(key: string): any
    env(key: string, value: any): void
    env(object: ObjectLike): void

    log(options: Partial<Log>): void

    /**
     * @see https://on.cypress.io/api/commands
     */
    Commands: {
      add(name: string, fn: (...args: any[]) => void): void;
      add(name: string, options: CommandOptions, fn: (...args: any[]) => void): void;
      overwrite(name: string, fn: (...args: any[]) => void): void;
      overwrite(name: string, options: CommandOptions, fn: (...args: any[]) => void): void;
    }

    /**
     * @see https://on.cypress.io/cookies
     */
    Cookies: {
      debug(enabled: boolean, options?: Partial<DebugOptions>): void;
      preserveOnce(...names: string[]): void;
      defaults(options: Partial<CookieDefaults>): void;
    }

    /**
     * @see https://on.cypress.io/dom
     */
    dom: {
      isHidden(element: JQuery | HTMLElement): boolean;
    }

    /**
     * @see https://on.cypress.io/api/api-server
     */
    Server: {
      defaults(options: Partial<ServerOptions>): void;
    }
  }

  interface Chainable {
    /**
     * @see https://on.cypress.io/and
     */
    and(chainers: string, value?: any): Chainable
    and(chainers: string, method: string, value: any): Chainable
    and(fn: (currentSubject?: any) => void): Chainable

    /**
     * @see https://on.cypress.io/as
     */
    as(alias: string): Chainable

    /**
     * @see https://on.cypress.io/blur
     */
    blur(options?: BlurOptions): Chainable

    /**
     * @see https://on.cypress.io/check
     */
    check(options?: CheckOptions): Chainable
    check(value: string | string[]): Chainable // no options

    /**
     * @see https://on.cypress.io/children
     */
    children(options?: LoggableTimeoutable): Chainable
    children(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/clear
     */
    clear(options?: ClearOptions): Chainable

    /**
     * @see https://on.cypress.io/clearcookie
     */
    clearCookie(name: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/clearcookies
     */
    clearCookies(options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/clearlocalstorage
     */
    clearLocalStorage(key?: string): Chainable
    clearLocalStorage(re: RegExp): Chainable

    /**
     * @see https://on.cypress.io/click
     */
    click(options?: ClickOptions): Chainable
    click(position: string, options?: ClickOptions): Chainable
    click(x: number, y: number, options?: ClickOptions): Chainable

    /**
     * @see https://on.cypress.io/closest
     */
    closest(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/contains
     */
    contains(text: string, options?: LoggableTimeoutable): Chainable
    contains(num: number | RegExp): Chainable
    contains(selector: string, text: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/dblclick
     */
    dblclick(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/debug
     */
    debug(options?: Loggable): Chainable

    /**
     * Get the window.document of the page that is currently active.
     *
     * @param {Loggable} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/document
     * @example
     *    cy.document()
     *      .its('contentType')
     *      .should('eq', 'text/html')
     */
    document(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/each
     */
    each(fn: (element?: any, index?: number, $list?: any) => void): Chainable

    /**
     * @see https://on.cypress.io/end
     */
    end(): Chainable

    /**
     * @see https://on.cypress.io/eq
     */
    eq(index: number, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/exec
     */
    exec(command: string, options?: ExecOptions): Chainable

    /**
     * @see https://on.cypress.io/filter
     */
    filter(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/find
     */
    find(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/first
     */
    first(options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/fixture
     */
    fixture(path: string, options?: Timeoutable): Chainable // no log?
    fixture(path: string, encoding: string, options?: Timeoutable): Chainable // no log?

    /**
     * Get the DOM element that is currently focused.
     *
     * @param {Loggable} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/focus
     */
    focus(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/focused
     */
    focused(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/get
     */
    get(selector: string, options?: LoggableTimeoutable): Chainable
    get(alias: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/getcookie
     */
    getCookie(name: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/getcookies
     */
    getCookies(options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/go
     */
    go(direction: HistoryDirection | number, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/hash
     */
    hash(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/invoke
     */
    invoke(functionName: string, ...args: any[]): Chainable

    /**
     * @see https://on.cypress.io/its
     */
    its(propertyName: string): Chainable

    /**
     * @see https://on.cypress.io/last
     */
    last(options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/location
     */
    location(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/log
     */
    log(message: string, args: any): Chainable

    /**
     * @see https://on.cypress.io/next
     */
    next(options?: LoggableTimeoutable): Chainable
    next(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/not
     */
    not(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/parent
     */
    parent(options?: LoggableTimeoutable): Chainable
    parent(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/parents
     */
    parents(options?: LoggableTimeoutable): Chainable
    parents(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/pause
     */
    pause(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/prev
     */
    prev(options?: LoggableTimeoutable): Chainable
    prev(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/readfile
     */
    readFile(filePath: string, options?: Timeoutable): Chainable // no log?
    readFile(filePath: string, encoding: string, options?: Timeoutable): Chainable // no log?

    /**
     * @see https://on.cypress.io/reload
     */
    reload(options?: LoggableTimeoutable): Chainable
    reload(forceReload: boolean): Chainable // no options?

    /**
     * @see https://on.cypress.io/request
     */
    request(url: string, body?: RequestBody): Chainable
    request(method: HttpMethod, url: string, body?: RequestBody): Chainable
    request(options: RequestOptions): Chainable

    /**
     * @see https://on.cypress.io/root
     */
    root(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/route
     */
    route(url: string, response?: any): Chainable
    route(method: string, url: string, response?: any): Chainable
    route(fn: () => RouteOptions | RouteOptions): Chainable

    /**
     * @see https://on.cypress.io/screenshot
     */
    screenshot(options?: LoggableTimeoutable): Chainable
    screenshot(fileName: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/select
     */
    select(text: string | string[], options?: SelectOptions): Chainable
    select(value: string | string[], options?: SelectOptions): Chainable

    /**
     * @see https://on.cypress.io/server
     */
    server(options?: ServerOptions): Chainable

    /**
     * @see https://on.cypress.io/setcookie
     */
    setCookie(name: string, value: string, options?: SetCookieOptions): Chainable

    /**
     * @see https://on.cypress.io/should
     */
    should(chainers: string, value?: any): Chainable
    should(chainers: string, method: string, value: any): Chainable
    should(fn: (currentSubject?: any) => void): Chainable

    /**
     * @see https://on.cypress.io/siblings
     */
    siblings(options?: LoggableTimeoutable): Chainable
    siblings(selector: string, options?: LoggableTimeoutable): Chainable

    /**
     * @see https://on.cypress.io/spread
     */
    spread(fn: (...args: any[]) => any): Chainable

    /**
     * @see https://on.cypress.io/submit
     */
    submit(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/then
     */
    then(fn: (currentSubject: any) => any, options?: Timeoutable): Chainable

    /**
     * @see https://on.cypress.io/title
     */
    title(options?: Loggable): Chainable

    /**
     * @description Trigger an event on a DOM element.
     * @param {string} eventName
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     * @example:
     *    cy.get('a').trigger('mousedown')
     */
    trigger(eventName: string): Chainable
    /**
     * @description Trigger an event on a DOM element at a named position.
     * @param {string} eventName
     * @param {PositionType} position
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     */
    trigger(eventName: string, position: PositionType): Chainable
    /**
     * @description Trigger an event on a DOM element with options.
     * @param {string} eventName
     * @param {TriggerOptions} options
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     */
    trigger(eventName: string, options: TriggerOptions): Chainable
    /**
     * @description Trigger an event on a DOM element at specific coordinates (from top left corner)
     * @param {string} eventName
     * @param {number} x The distance in pixels from element’s left to trigger the event.
     * @param {number} y The distance in pixels from element’s top to trigger the event.
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     */
    trigger(eventName: string, x: number, y: number): Chainable
    /**
     * @description Trigger an event on a DOM element
     *
     * @param {string} eventName
     * @param {PositionType} position
     * @param {TriggerOptions} options
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     */
    trigger(eventName: string, position: PositionType, options: TriggerOptions): Chainable
    /**
     * @description Trigger an event on a DOM element
     *
     * @param {string} eventName
     * @param {number} x The distance in pixels from element’s left to trigger the event.
     * @param {number} y The distance in pixels from element’s top to trigger the event.
     * @param {TriggerOptions} options
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/trigger
     */
    trigger(eventName: string, x: number, y: number, options: TriggerOptions): Chainable

    /**
     * Type into a DOM element.
     *
     * @param {string} text The text to be typed into the DOM element.
     * @param {TypeOptions} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/type
     * @example
     *
     *    cy.get('input').type('Hello, World')
     *    // Type 'Hello, World' into the 'input'
     */
    type(text: string, options?: TypeOptions): Chainable

    /**
     * @see https://on.cypress.io/uncheck
     */
    uncheck(options?: CheckOptions): Chainable
    uncheck(values: string[]): Chainable // no options? missing single value variant

    /**
     * @see https://on.cypress.io/url
     */
    url(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/viewport
     */
    viewport(width: number, height: number, options?: Loggable): Chainable
    viewport(preset: string, orientation: ViewportOrientation, options?: Loggable): Chainable

    /**
     * Visit the given url
     *
     * @param {string} url The URL to visit. If relative uses `baseUrl`
     * @param {VisitOptions} [options] Pass in an options object to change the default behavior of `cy.visit()`
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/visit
     * @example
     *    cy.visit('http://localhost:3000')
     */
    visit(url: string, options?: VisitOptions): Chainable

    /**
     * @see https://on.cypress.io/wait
     */
    wait(ms: number | string[]): Chainable // no options?
    wait(alias: string, options?: LoggableTimeoutable): Chainable

    /**
     * Get the window object of the page that is currently active.
     *
     * @param {Loggable} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/window
     * @example
     *    cy.visit('http://localhost:8080/app')
     *    cy.window().then(function(win){
     *      // win is the remote window
     *      // of the page at: http://localhost:8080/app
     *    })
     */
    window(options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/within
     */
    within(fn: (currentSubject?: any) => void): Chainable
    within(options: Loggable, fn: (currentSubject?: any) => void): Chainable // inconsistent argument order

    /**
     * @see https://on.cypress.io/wrap
     */
    wrap(Object: object, options?: Loggable): Chainable

    /**
     * @see https://on.cypress.io/writefile
     */
    writeFile(filePath: string, contents: FileContents, options?: Timeoutable): Chainable
    writeFile(filePath: string, contents: FileContents, encoding: string, options?: Timeoutable): Chainable
  }

  interface DebugOptions {
    verbose?: boolean
  }

  interface CookieDefaults {
    whitelist?: string | string[] | RegExp | ((cookie: any) => boolean)
  }

  /**
   * Options that control how a command is logged in the Reporter
   *
   * @interface Loggable
   */
  interface Loggable {
    /**
     * Displays the command in the Command Log
     *
     * @type {boolean}
     * @default true
     * @memberof Loggable
     */
    log?: boolean
  }

  /**
   * Options that control how long Test Runner is waiting for command to succeed
   *
   * @interface Timeoutable
   */
  interface Timeoutable {
    /**
     * Time to wait (ms)
     *
     * @type {number} milliseconds
     * @default defaultCommandTimeout
     * @memberof Timeoutable
     * @see https://docs.cypress.io/guides/references/configuration.html#Timeouts
     */
    timeout?: number
  }

  /**
   * Union of Loggable and Timeoutable interfaces
   *
   * @interface LoggableTimeoutable
   * @extends {Loggable}
   * @extends {Timeoutable}
   */
  interface LoggableTimeoutable extends Loggable, Timeoutable { }

  /**
   * Options to force an event, skipping Actionability check
   * @see https://docs.cypress.io/guides/core-concepts/interacting-with-elements.html#Actionability
   * @interface Forceable
   */
  interface Forceable {
    /**
     * Forces the action, disables waiting for actionability
     *
     * @type {boolean}
     * @default false
     * @memberof Forceable
     */
    force?: boolean
  }

  interface BlurOptions extends Loggable, Forceable { }

  interface CheckOptions extends LoggableTimeoutable, Forceable {
    interval?: number
  }

  interface ClearOptions extends LoggableTimeoutable, Forceable {
    interval?: number
  }

  /**
   * Object to change the default behavior of .click().
   *
   * @interface ClickOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   */
  interface ClickOptions extends Loggable, Timeoutable {
    /**
     * Forces the action, disables waiting for actionability
     *
     * @type {boolean}
     * @default false
     * @memberof ClickOptions
     */
    force?: boolean
    /**
     * Serially click multiple elements
     *
     * @type {boolean}
     * @default false
     * @memberof ClickOptions
     */
    multiple?: boolean
  }

  /**
   * Options object to change the default behavior of cy.exec().
   *
   * @interface ExecOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   */
  interface ExecOptions extends Loggable, Timeoutable {
    /**
     * Whether to fail if the command exits with a non-zero code
     *
     * @type {boolean}
     * @default true
     * @memberof ExecOptions
     */
    failOnNonZeroExit?: boolean
    /**
     * Object of environment variables to set before the command executes
     * (e.g. {USERNAME: 'johndoe'}). Will be merged with existing
     * system environment variables
     *
     * @type {object}
     * @default {}
     * @memberof ExecOptions
     */
    env?: object
  }

  /**
   *
   *
   * @interface RequestOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   */
  interface RequestOptions extends Loggable, Timeoutable {
    auth?: object
    body?: RequestBody
    failOnStatusCode?: boolean
    followRedirect?: boolean
    form?: boolean
    gzip?: boolean
    headers?: object
    method?: HttpMethod
    qs?: string
    url: string
  }

  interface RouteOptions {
    method?: HttpMethod
    url?: string | RegExp
    response?: any
    status?: number
    delay?: number
    headers?: object
    force404?: boolean
    onRequest?(...args: any[]): void
    onResponse?(...args: any[]): void
    onAbort?(...args: any[]): void
  }

  interface SelectOptions extends Loggable, Timeoutable {
    force?: boolean
    interval?: number
  }

  interface ServerOptions {
    delay?: number
    method?: HttpMethod
    status?: number
    headers?: object
    response?: any
    onRequest?(...args: any[]): void
    onResponse?(...args: any[]): void
    onAbort?(...args: any[]): void
    enable?: boolean
    force404?: boolean
    urlMatchingOptions?: object
    whitelist?(...args: any[]): void
  }

  interface SetCookieOptions extends Loggable, Timeoutable {
    path?: string
    domain?: string
    secure?: boolean
    httpOnly?: boolean
    expiry?: number
  }

  /**
   * Options that control `cy.type` command
   *
   * @interface TypeOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   * @see https://on.cypress.io/type
   */
  interface TypeOptions extends Loggable, Timeoutable {
    /**
     * Delay after each keypress (ms)
     *
     * @type {number}
     * @default 10
     * @memberof TypeOptions
     */
    delay?: number
    /**
     * Forces the action, disables waiting for actionability
     *
     * @type {boolean}
     * @default false
     * @memberof TypeOptions
     */
    force?: boolean
    /**
     * Keep a modifier activated between commands
     *
     * @type {boolean}
     * @default true
     * @memberof TypeOptions
     */
    release?: boolean
  }

  /**
   * Visit website options
   *
   * @interface VisitOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   * @see https://on.cypress.io/visit
   */
  interface VisitOptions extends Loggable, Timeoutable {
    /**
     * Called before your page has loaded all of its resources.
     *
     * @param {Window} contentWindow the remote page's window object
     * @memberof VisitOptions
     */
    onBeforeLoad?(win: Window): void

    /**
     * Called once your page has fired its load event.
     *
     * @param {Window} contentWindow the remote page's window object
     * @memberof VisitOptions
     */
    onLoad?(win: Window): void

    /**
     * Whether to fail on response codes other than 2xx and 3xx
     *
     * @type {boolean}
     * @default {true}
     * @memberof VisitOptions
     */
    failOnStatusCode?: boolean
  }

  /**
   * Options to change the default behavior of .trigger()
   *
   * @interface TriggerOptions
   */
  interface TriggerOptions extends LoggableTimeoutable, Forceable {
    /**
     * Whether the event bubbles
     *
     * @type {boolean}
     * @default true
     * @memberof TriggerOptions
     */
    bubbles?: boolean
    /**
     * Whether the event is cancelable
     *
     * @type {boolean}
     * @default true
     * @memberof TriggerOptions
     */
    cancable?: boolean
  }

  interface ConfigOptions {
    /**
     * Url used as prefix for [cy.visit()](https://on.cypress.io/visit) or [cy.request()](https://on.cypress.io/request) command’s url
     * @default null
     */
    baseUrl: string | null
    /**
     * Any values to be set as [environment variables](https://docs.cypress.io/guides/guides/environment-variables.html)
     * @default {}
     */
    env: { [key: string]: any }
    /**
     * A String or Array of glob patterns used to ignore test files that would otherwise be shown in your list of tests. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.
     * @default "*.hot-update.js"
     */
    ignoreTestFiles: string | string[]
    /**
     * The number of tests for which snapshots and command data are kept in memory. Reduce this number if you are experiencing high memory consumption in your browser during a test run.
     * @default 50
     */
    numTestsKeptInMemory: number
    /**
     * Port used to host Cypress. Normally this is a randomly generated port
     * @default null
     */
    port: number | null
    /**
     * The [reporter](https://docs.cypress.io/guides/guides/reporters.html) used when running headlessly or in CI
     * @default "spec"
     */
    reporter: string
    /**
     * Whether to take a screenshot on test failure when running headlessly or in CI
     * @default true
     */
    screenshotOnHeadlessFailure: boolean
    /**
     * Whether Cypress will watch and restart tests on test file changes
     * @default true
     */
    watchForFileChanges: boolean
    /**
     * Time, in milliseconds, to wait until most DOM based commands are considered timed out
     * @default 4000
     */
    defaultCommandTimeout: number
    /**
     * Time, in milliseconds, to wait for a system command to finish executing during a [cy.exec()](https://on.cypress.io/exec) command
     * @default 60000
     */
    execTimeout: number
    /**
     * Time, in milliseconds, to wait for page transition events or [cy.visit()](https://on.cypress.io/visit), [cy.go()](https://on.cypress.io/go), [cy.reload()](https://on.cypress.io/reload) commands to fire their page load events
     * @default 60000
     */
    pageLoadTimeout: number
    /**
     * Time, in milliseconds, to wait for an XHR request to go out in a [cy.wait()](https://on.cypress.io/wait) command
     * @default 5000
     */
    requestTimeout: number
    /**
     * Time, in milliseconds, to wait until a response in a [cy.request()](https://on.cypress.io/request), [cy.wait()](https://on.cypress.io/wait), [cy.fixture()](https://on.cypress.io/fixture), [cy.getCookie()](https://on.cypress.io/getcookie), [cy.getCookies()](https://on.cypress.io/getcookies), [cy.setCookie()](https://on.cypress.io/setcookie), [cy.clearCookie()](https://on.cypress.io/clearcookie), [cy.clearCookies()](https://on.cypress.io/clearcookies), and [cy.screenshot()](https://on.cypress.io/screenshot) commands
     * @default 30000
     */
    responseTimeout: number
    /**
     * Path to folder where application files will attempt to be served from
     * @default root project folder
     */
    fileServerFolder: string
    /**
     * Path to folder containing fixture files (Pass false to disable)
     * @default "cypress/fixtures"
     */
    fixturesFolder: string
    /**
     * Path to folder containing integration test files
     * @default "cypress/integration"
     */
    integrationFolder: string
    /**
     * Path to plugins file. (Pass false to disable)
     * @default "cypress/plugins/index.js"
     */
    pluginsFile: string
    /**
     * Path to folder where screenshots will be saved from [cy.screenshot()](https://on.cypress.io/screenshot) command or after a headless or CI run’s test failure
     * @default "cypress/screenshots"
     */
    screenshotsFolder: string
    /**
     * Path to file to load before test files load. This file is compiled and bundled. (Pass false to disable)
     * @default "cypress/support/index.js"
     */
    supportFile: string
    /**
     * Path to folder where videos will be saved after a headless or CI run
     * @default "cypress/videos"
     */
    videosFolder: string
    /**
     * Whether Cypress will trash assets within the screenshotsFolder and videosFolder before headless test runs.
     * @default true
     */
    trashAssetsBeforeHeadlessRuns: boolean
    /**
     * The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be false to disable compression or a value between 0 and 51, where a lower value results in better quality (at the expense of a higher file size).
     * @default 32
     */
    videoCompression: number
    /**
     * Whether Cypress will record a video of the test run when running headlessly.
     * @default true
     */
    videoRecording: boolean
    /**
     * Whether Cypress will upload the video to the Dashboard even if all tests are passing. This applies only when recording your runs to the Dashboard. Turn this off if you’d like the video uploaded only when there are failing tests.
     * @default true
     */
    videoUploadOnPasses: boolean
    /**
     * Whether Chrome Web Security for same-origin policy and insecure mixed content is enabled. Read more about this here
     * @default true
     */
    chromeWebSecurity: boolean
    /**
     * Default height in pixels for the application under tests’ viewport (Override with [cy.viewport()](https://on.cypress.io/viewport) command)
     * @default 660
     */
    viewportHeight: number
    /**
     * Default width in pixels for the application under tests’ viewport. (Override with [cy.viewport()](https://on.cypress.io/viewport) command)
     * @default 1000
     */
    viewportWidth: number
    /**
     * The distance in pixels an element must exceed over time to be considered animating
     * @default 5
     */
    animationDistanceThreshold: number
    /**
     * Whether to wait for elements to finish animating before executing commands
     * @default true
     */
    waitForAnimations: boolean
  }

  interface Log {
    $el: any
    /** Allows the name of the command to be overwritten */
    name: string
    /** Override *name* for display purposes only */
    displayName: string
    message: any
    /** Return an object that will be printed in the dev tools console */
    consoleProps(): any
  }

  type PositionType = "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight"
}

// global variables added by Cypress when it runs
declare const cy: Cypress.Chainable
declare const Cypress: Cypress.Cypress
