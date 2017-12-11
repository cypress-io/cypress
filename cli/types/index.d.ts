// Project: https://www.cypress.io
// GitHub:  https://github.com/cypress-io/cypress
// Definitions by: Gert Hengeveld <https://github.com/ghengeveld>
//                 Mike Woudenberg <https://github.com/mikewoudenberg>
//                 Robbert van Markus <https://github.com/rvanmarkus>
//                 Nicholas Boll <https://github.com/nicholasboll>
// TypeScript Version: 2.5
// Updated by the Cypress team: https://www.cypress.io/about/

/// <reference types="blob-util" />
/// <reference types="bluebird" />
/// <reference types="chai" />
/// <reference types="chai-jquery" />
/// <reference types="jquery" />
/// <reference types="lodash" />
/// <reference types="minimatch" />
/// <reference types="mocha" />
/// <reference types="sinon" />
/// <reference types="sinon-chai" />

// Cypress adds chai expect and assert to global
declare const expect: Chai.ExpectStatic
declare const assert: Chai.AssertStatic

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
      add(name: string, fn: (...args: any[]) => void): void
      add(name: string, options: CommandOptions, fn: (...args: any[]) => void): void
      overwrite(name: string, fn: (...args: any[]) => void): void
      overwrite(name: string, options: CommandOptions, fn: (...args: any[]) => void): void
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
      isHidden(element: JQuery | HTMLElement): boolean
    }

    /**
     * @see https://on.cypress.io/api/api-server
     */
    Server: {
      defaults(options: Partial<ServerOptions>): void
    }
  }

  /**
   * Chainable interface for non-array Subjects
   */
  interface Chainable<Subject = any> {
    /**
     * Create an assertion. Assertions are automatically retried until they pass or time out.
     *
     * @alias should
     * @see https://on.cypress.io/and
     */
    and: Chainer<Subject>

    /**
     * Assign an alias for later use. Reference the alias later within a
     * [cy.get()](https://on.cypress.io/get) or
     * [cy.wait()](https://on.cypress.io/wait) command with a `@` prefix.
     *
     * @see https://on.cypress.io/as
     */
    as(alias: string): Chainable<Subject>

    /**
     * Blur a focused element. This element must currently be in focus. If you want to ensure an element is focused before blurring, try using .focus() before .blur().
     *
     * @see https://on.cypress.io/blur
     */
    blur(options?: Partial<BlurOptions>): Chainable<Subject>

    /**
     * Check checkbox(es) or radio(s). This element must be an `<input>` with type `checkbox` or `radio`.
     *
     * @see https://on.cypress.io/check
     */
    check(options?: Partial<CheckOptions>): Chainable<Subject>
    check(value: string | string[], options?: Partial<CheckOptions>): Chainable<Subject>

    /**
     * Get the children of each DOM element within a set of DOM elements.
     *
     * @see https://on.cypress.io/children
     */
    children<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    children<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    children<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Clear the value of an `input` or `textarea`.
     * An alias for `.type({selectall}{backspace})`
     *
     * @see https://on.cypress.io/clear
     */
    clear(options?: Partial<ClearOptions>): Chainable<Subject>

    /**
     * Clear a specific browser cookie.
     * Cypress automatically clears all cookies before each test to prevent state from being shared across tests. You shouldn’t need to use this command unless you’re using it to clear a specific cookie inside a single test.
     *
     * @see https://on.cypress.io/clearcookie
     */
    clearCookie(name: string, options?: Partial<Loggable & Timeoutable>): Chainable<null>

    /**
     * Clear all browser cookies.
     * Cypress automatically clears all cookies before each test to prevent state from being shared across tests. You shouldn’t need to use this command unless you’re using it to clear a specific cookie inside a single test.
     *
     * @see https://on.cypress.io/clearcookies
     */
    clearCookies(options?: Partial<Loggable & Timeoutable>): Chainable<null>

    /**
     * Clear data in local storage.
     * Cypress automatically runs this command before each test to prevent state from being shared across tests. You shouldn’t need to use this command unless you’re using it to clear localStorage inside a single test.
     *
     * @see https://on.cypress.io/clearlocalstorage
     */
    clearLocalStorage(key?: string): Chainable<null>
    clearLocalStorage(re: RegExp): Chainable<null>

    /**
     * Click a DOM element.
     *
     * @see https://on.cypress.io/click
     */
    click(options?: Partial<ClickOptions>): Chainable<Subject>
    click(position: string, options?: Partial<ClickOptions>): Chainable<Subject>
    click(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>

    /**
     * `cy.clock()` overrides native global functions related to time allowing them to be controlled
     * synchronously via [cy.tick()](https://on.cypress.io/tick) or the yielded clock object.
     * This includes controlling:
     * * `setTimeout`
     * * `clearTimeout`
     * * `setInterval`
     * * `clearInterval`
     * * `Date` Objects
     *
     * The clock starts at the unix epoch (timestamp of 0). This means that when you instantiate new Date in your application, it will have a time of January 1st, 1970.
     *
     * @see https://on.cypress.io/clock
     */
    clock(): Chainable<Clock>
    clock(now: number, options?: Loggable): Chainable<Clock>
    clock(now: number, functions?: Array<'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval'>, options?: Loggable): Chainable<Clock>
    clock(options: Loggable): Chainable<Clock>

    /**
     * Get the first DOM element that matches the selector (whether it be itself or one of its ancestors).
     *
     * @see https://on.cypress.io/closest
     */
    closest<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    closest<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the DOM element containing the text. DOM elements can contain more than the desired text and still match. Additionally, Cypress prefers some DOM elements over the deepest element found.
     *
     * @see https://on.cypress.io/contains
     */
    contains(content: string | number | RegExp): Chainable<Subject>
    contains<E extends Node = HTMLElement>(content: string | number | RegExp): Chainable<JQuery<E>>
    contains<K extends keyof HTMLElementTagNameMap>(selector: K, text: string | number | RegExp, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    contains<E extends Node = HTMLElement>(selector: string, text: string | number | RegExp, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Double-click a DOM element.
     *
     * @see https://on.cypress.io/dblclick
     */
    dblclick(options?: Partial<Loggable>): Chainable

    /**
     * Set a debugger and log what the previous command yields.
     *
     * @see https://on.cypress.io/debug
     */
    debug(options?: Partial<Loggable>): Chainable<Subject>

    /**
     * Get the window.document of the page that is currently active.
     *
     * @see https://on.cypress.io/document
     * @example document
     * ```ts
     * cy.document()
     *   .its('contentType')
     *   .should('eq', 'text/html')
     * ```
     */
    document(options?: Partial<Loggable>): Chainable<Document>

    /**
     * Iterate through an array like structure (arrays or objects with a length property).
     *
     * @see https://on.cypress.io/each
     */
    each<E extends Node = HTMLElement>(fn: (element: JQuery<E>, index: number, $list: E[]) => void): Chainable<JQuery<E>> // Can't properly infer type without breaking down Chainable
    each(fn: (item: any, index: number, $list: any[]) => void): Chainable<Subject>

    /**
     * End a chain of commands
     *
     * @see https://on.cypress.io/end
     */
    end(): Chainable<null>

    /**
     * Get A DOM element at a specific index in an array of elements.
     *
     * @see https://on.cypress.io/eq
     */
    eq<E extends Node = HTMLElement>(index: number, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Execute a system command.
     * @see https://on.cypress.io/exec
     */
    exec(command: string, options?: Partial<ExecOptions>): Chainable<Exec>

    /**
     * Get the DOM elements that match a specific selector. Opposite of `.not()`
     *
     * @see https://on.cypress.io/filter
     */
    filter<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>> // automatically returns the correct HTMLElement type
    filter<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the descendent DOM elements of a specific selector.
     *
     * @see https://on.cypress.io/find
     */
    find<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    find<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the first DOM element within a set of DOM elements.
     *
     * @see https://on.cypress.io/first
     */
    first(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>

    /**
     * Load a fixed set of data located in a file.
     *
     * @see https://on.cypress.io/fixture
     */
    fixture<Contents = any>(path: string, options?: Partial<Timeoutable>): Chainable<Contents> // no log?
    fixture<Contents = any>(path: string, encoding: Encodings, options?: Partial<Timeoutable>): Chainable<Contents> // no log?

    /**
     * Get the DOM element that is currently focused.
     *
     * @see https://on.cypress.io/focus
     */
    focus(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>

    /**
     * Get the DOM element that is currently focused.
     *
     * @see https://on.cypress.io/focused
     */
    focused(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>

    /**
     * Get one or more DOM elements by selector or alias.
     * @see https://on.cypress.io/get
     */
    get<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    get<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    get<S = any>(alias: string, options?: Partial<Loggable & Timeoutable>): Chainable<S>

    /**
     * Get a browser cookie by its name.
     *
     * @see https://on.cypress.io/getcookie
     */
    getCookie(name: string, options?: Partial<Loggable & Timeoutable>): Chainable<Cookie | null>

    /**
     * Get all of the browser cookies.
     *
     * @see https://on.cypress.io/getcookies
     */
    getCookies(options?: Partial<Loggable & Timeoutable>): Chainable<Cookie[]>

    /**
     * Navigate back or forward to the previous or next URL in the browser’s history.
     *
     * @see https://on.cypress.io/go
     */
    go(direction: HistoryDirection | number, options?: Partial<Loggable & Timeoutable>): Chainable<Window>

    /**
     * Get the current URL hash of the page that is currently active.
     *
     * @see https://on.cypress.io/hash
     */
    hash(options?: Partial<Loggable>): Chainable<string>

    /**
     * Invoke a function on the previously yielded subject.
     * This isn't possible to strongly type without generic override yet.
     * If called on an object you can do this instead: `.then(s => s.show())`.
     * If called on an array you can do this instead: `.each(s => s.show())`.
     * From there the subject will be properly typed.
     *
     * @see https://on.cypress.io/invoke
     */
    invoke(functionName: keyof Subject, ...args: any[]): Chainable<Subject> // don't have a way to express return types yet

    /**
     * Get a property’s value on the previously yielded subject.
     *
     * @see https://on.cypress.io/its
     */
    its<K extends keyof Subject>(propertyName: K): Chainable<Subject[K]>

    /**
     * Get the last DOM element within a set of DOM elements.
     *
     * @see https://on.cypress.io/last
     */
    last<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the global `window.location` object of the page that is currently active.
     *
     * @see https://on.cypress.io/location
     */
    location(options?: Partial<Loggable & Timeoutable>): Chainable<Location>
    location(key: string, options?: Partial<Loggable & Timeoutable>): Chainable<Location>

    /**
     * Print a message to the Cypress Command Log.
     *
     * @see https://on.cypress.io/log
     */
    log(message: string, ...args: any[]): Chainable<null>

    /**
     * Get the immediately following sibling of each DOM element within a set of DOM elements.
     *
     * @see https://on.cypress.io/next
     */
    next<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    next<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    next<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get all following siblings of each DOM element in a set of matched DOM elements.
     *
     * @see https://on.cypress.io/nextall
     */
    nextAll<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    nextAll<E extends HTMLElement = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    nextAll<E extends HTMLElement = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get all following siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.
     *
     * @see https://on.cypress.io/nextuntil
     */
    nextUntil<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    nextUntil<E extends HTMLElement = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    nextUntil<E extends HTMLElement = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Filter DOM element(s) from a set of DOM elements. Opposite of `.filter()`
     *
     * @see https://on.cypress.io/not
     */
    not(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>

    /**
     * Get the parent DOM element of a set of DOM elements.
     *
     * @see https://on.cypress.io/parent
     */
    parent<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    parent<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    parent<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the parent DOM elements of a set of DOM elements.
     *
     * @see https://on.cypress.io/parents
     */
    parents<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    parents<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    parents<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get all ancestors of each DOM element in a set of matched DOM elements up to, but not including, the element provided.
     *
     * @see https://on.cypress.io/parentsuntil
     */
    parentsUntil<K extends keyof HTMLElementTagNameMap>(selector: K, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    parentsUntil<E extends Node = HTMLElement>(selector: string, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    parentsUntil<E extends Node = HTMLElement>(element: E | JQuery<E>, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Stop cy commands from running and allow interaction with the application under test. You can then “resume” running all commands or choose to step through the “next” commands from the Command Log.
     * This does not set a `debugger` in your code, unlike `.debug()`
     *
     * @see https://on.cypress.io/pause
     */
    pause(options?: Partial<Loggable>): Chainable<Subject>

    /**
     * Get the immediately preceding sibling of each element in a set of the elements.
     *
     * @see https://on.cypress.io/prev
     */
    prev<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    prev<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    prev<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get all previous siblings of each DOM element in a set of matched DOM elements.
     * > The querying behavior of this command matches exactly how [.prevAll()](http://api.jquery.com/prevAll) works in jQuery.
     *
     * @see https://on.cypress.io/prevall
     */
    prevAll<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    prevAll<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    prevAll<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get all previous siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.
     * > The querying behavior of this command matches exactly how [.prevUntil()](http://api.jquery.com/prevUntil) works in jQuery.
     *
     * @see https://on.cypress.io/prevall
     */
    prevUntil<K extends keyof HTMLElementTagNameMap>(selector: K, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    prevUntil<E extends Node = HTMLElement>(selector: string, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    prevUntil<E extends Node = HTMLElement>(element: E | JQuery<E>, filter?: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Read a file and yield its contents.
     *
     * @see https://on.cypress.io/readfile
     */
    readFile<Contents = any>(filePath: string, options?: Partial<Loggable & Timeoutable>): Chainable<Contents>
    readFile<Contents = any>(filePath: string, encoding: Encodings, options?: Partial<Loggable & Timeoutable>): Chainable<Contents>

    /**
     * Reload the page.
     *
     * @see https://on.cypress.io/reload
     */
    reload(options?: Partial<Loggable & Timeoutable>): Chainable<Window>
    reload(forceReload: boolean): Chainable<Window>

    /**
     * Make an HTTP request.
     *
     * @see https://on.cypress.io/request
     */
    request(url: string, body?: RequestBody): Chainable<Response>
    request(method: HttpMethod, url: string, body?: RequestBody): Chainable<Response>
    request(options: Partial<RequestOptions>): Chainable<Response>

    /**
     * Get the root DOM element.
     * The root element yielded is `<html>` by default. However, when calling `.root()` from a `.within()` command, the root element will point to the element you are “within”.
     *
     * @see https://on.cypress.io/root
     */
    root<E extends Node = HTMLHtmlElement>(options?: Partial<Loggable>): Chainable<JQuery<E>> // can't do better typing unless we ignore the `.within()` case

    /**
     * Use `cy.route()` to manage the behavior of network requests.
     *
     * @see https://on.cypress.io/route
     */
    route(url: string | RegExp, response?: string | Response): Chainable<null>
    route(method: string, url: string | RegExp, response?: string | Response): Chainable<null>
    route(fn: () => RouteOptions): Chainable<null>
    route(options: Partial<RouteOptions>): Chainable<null>

    /**
     * Take a screenshot of the application under test and the Cypress Command Log.
     *
     * @see https://on.cypress.io/screenshot
     */
    screenshot(options?: Partial<Loggable & Timeoutable>): Chainable<null>
    screenshot(fileName: string, options?: Partial<Loggable & Timeoutable>): Chainable<null>

    /**
     * Scroll an element into view.
     *
     * @see https://on.cypress.io/scrollintoview
     */
    scrollIntoView(options?: Partial<ScrollIntoViewOptions>): Chainable<Subject>

    /**
     * Scroll to a specific position.
     *
     * @see https://on.cypress.io/scrollto
     */
    scrollTo(position: PositionType, options?: Partial<ScrollToOptions>): Chainable<Subject>
    scrollTo(x: number | string, y: number | string, options?: Partial<ScrollToOptions>): Chainable<Subject>

    /**
     * Select an `<option>` within a `<select>`.
     *
     * @see https://on.cypress.io/select
     */
    select(text: string | string[], options?: Partial<SelectOptions>): Chainable<Subject>
    select(value: string | string[], options?: Partial<SelectOptions>): Chainable<Subject>

    /**
     * Start a server to begin routing responses to `cy.route()` and `cy.request()`.
     *
     * @see https://on.cypress.io/server
     */
    server(options?: Partial<ServerOptions>): Chainable<null>

    /**
     * Set a browser cookie.
     *
     * @see https://on.cypress.io/setcookie
     */
    setCookie(name: string, value: string, options?: Partial<SetCookieOptions>): Chainable<Cookie>

    /**
     * Create an assertion. Assertions are automatically retried until they pass or time out.
     *
     * @see https://on.cypress.io/should
     */
    should: Chainer<Subject>

    /**
     * Get sibling DOM elements.
     *
     * @see https://on.cypress.io/siblings
     */
    siblings<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    siblings<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    siblings<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Wrap a method in a spy in order to record calls to and arguments of the function.
     * > Note: `.spy()` assumes you are already familiar with our guide: [Stubs, Spies, and Clocks](https://docs.cypress.io/guides/guides/stubs-spies-and-clocks.html)
     *
     * @see https://on.cypress.io/spy
     */
    spy(): Agent<sinon.SinonSpy>
    spy(func: (...args: any[]) => any): Agent<sinon.SinonSpy>
    spy<T>(obj: T, method: keyof T): Agent<sinon.SinonSpy>

    /**
     * Replace a function, record its usage and control its behavior.
     * > Note: `.stub()` assumes you are already familiar with our guide: [Stubs, Spies, and Clocks](https://docs.cypress.io/guides/guides/stubs-spies-and-clocks.html)
     *
     * @see https://on.cypress.io/stub
     */
    stub(): Agent<sinon.SinonStub>
    stub(obj: any): Agent<sinon.SinonStub>
    stub<T>(obj: T, method: keyof T): Agent<sinon.SinonStub>
    stub<T>(obj: T, method: keyof T, func: (...args: any[]) => any): Agent<sinon.SinonStub>

    /**
     * Submit a form.
     *
     * @see https://on.cypress.io/submit
     */
    submit(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>

    spread<S extends object | any[] | string | number | boolean>(fn: (...args: any[]) => S): Chainable<S>
    spread(fn: (...args: any[]) => void): Chainable<Subject>

    /**
     * Enables you to work with the subject yielded from the previous command.
     *
     * @see https://on.cypress.io/then
     */
    then<S extends object | any[] | string | number | boolean>(fn: (this: ObjectLike, currentSubject: Subject) => S, options?: Partial<Timeoutable>): Chainable<S>
    then(fn: (this: ObjectLike, currentSubject: Subject) => void, options?: Partial<Timeoutable>): Chainable<Subject>

    /**
     * Move time after overriding a native time function with [cy.clock()](https://on.cypress.io/clock).
     * `cy.clock()` must be called before `cy.tick()`
     *
     * @see https://on.cypress.io/clock
     */
    tick(milliseconds: number): Chainable<Clock>

    /**
     * Get the `document.title` property of the page that is currently active.
     *
     * @see https://on.cypress.io/title
     */
    title(options?: Partial<Loggable>): Chainable<string>

    /**
     * Trigger an event on a DOM element.
     *
     * @see https://on.cypress.io/trigger
     */
    trigger<K extends keyof DocumentEventMap>(eventName: K, options?: Partial<TriggerOptions & DocumentEventMap[K]>): Chainable<Subject>
    trigger<K extends keyof DocumentEventMap>(eventName: K, position?: PositionType, options?: Partial<TriggerOptions & DocumentEventMap[K]>): Chainable<Subject>
    trigger<K extends keyof DocumentEventMap>(eventName: K, x: number, y: number, options?: Partial<TriggerOptions & DocumentEventMap[K]>): Chainable<Subject>
    // custom events... If the following were `.triggerCustom`, `.trigger` strongly typed with event data
    trigger(eventName: string, position?: PositionType, options?: Partial<TriggerOptions>): Chainable<Subject>
    trigger(eventName: string, options?: Partial<TriggerOptions & ObjectLike>): Chainable<Subject>
    trigger(eventName: string, x: number, y: number, options?: Partial<TriggerOptions>): Chainable<Subject>

    /**
     * Type into a DOM element.
     *
     * @see https://on.cypress.io/type
     * @example type
     * ```ts
     * cy.get('input').type('Hello, World')
     * ```
     */
    type(text: string, options?: Partial<TypeOptions>): Chainable<Subject>

    /**
     * Uncheck checkbox(es).
     *
     * @see https://on.cypress.io/uncheck
     */
    uncheck(options?: Partial<CheckOptions>): Chainable<Subject>
    uncheck(value: string, options?: Partial<CheckOptions>): Chainable<Subject>
    uncheck(values: string[], options?: Partial<CheckOptions>): Chainable<Subject>

    /**
     * Get the current URL of the page that is currently active.
     *
     * @alias cy.location('href')
     * @see https://on.cypress.io/url
     */
    url(options?: Partial<Loggable & Timeoutable>): Chainable<string>

    /**
     * Control the size and orientation of the screen for your application.
     *
     * @see https://on.cypress.io/viewport
     */
    viewport(preset: ViewportPreset, orientation?: ViewportOrientation, options?: Partial<Loggable>): Chainable<null>
    viewport(width: number, height: number, options?: Partial<Loggable>): Chainable<null>

    /**
     * Visit the given url
     *
     * @param {string} url The URL to visit. If relative uses `baseUrl`
     * @param {VisitOptions} [options] Pass in an options object to change the default behavior of `cy.visit()`
     * @see https://on.cypress.io/visit
     * @example visit
     * ```ts
     * cy.visit('http://localhost:3000')
     * ```
     */
    visit(url: string, options?: Partial<VisitOptions>): Chainable<Window>

    /**
     * Wait for a number of milliseconds or wait for an aliased resource to resolve before moving on to the next command.
     *
     * @see https://on.cypress.io/wait
     */
    wait(ms: number, options?: Partial<Loggable & Timeoutable>): Chainable<undefined>
    wait(alias: string, options?: Partial<Loggable & Timeoutable>): Chainable<WaitXHR>
    wait(alias: string[], options?: Partial<Loggable & Timeoutable>): Chainable<WaitXHR[]>

    /**
     * Get the window object of the page that is currently active.
     *
     * @see https://on.cypress.io/window
     * @example window
     * ```ts
     * cy.visit('http://localhost:8080/app')
     * cy.window().then(function(win){
     *   // win is the remote window
     *   // of the page at: http://localhost:8080/app
     * })
     * ```
     */
    window(options?: Partial<Loggable & Timeoutable>): Chainable<Window>

    /**
     * Scopes all subsequent cy commands to within this element. Useful when working within a particular group of elements such as a `<form>`.
     * @see https://on.cypress.io/within
     */
    within(fn: (currentSubject: Subject) => void): Chainable<Subject>
    within(options: Partial<Loggable>, fn: (currentSubject?: Subject) => void): Chainable<Subject> // inconsistent argument order

    /**
     * Yield the object passed into `.wrap()`.
     *
     * @see https://on.cypress.io/wrap
     */
    wrap<E extends Node = HTMLElement>(element: E | JQuery<E>, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    wrap<S>(object: S, options?: Partial<Loggable & Timeoutable>): Chainable<S>

    /**
     * Write to a file with the specified contents.
     *
     * @see https://on.cypress.io/writefile
     */
    writeFile<C extends FileContents>(filePath: string, contents: C, options?: Partial<Loggable>): Chainable<C>
    writeFile<C extends FileContents>(filePath: string, contents: C, encoding: Encodings, options?: Partial<Loggable>): Chainable<C>
  }

  interface Agent<A extends sinon.SinonSpy> {
    log(shouldOutput?: boolean): Omit<A, 'withArgs'> & Agent<A>

    as(alias: string): Omit<A, 'withArgs'> & Agent<A>

    withArgs(...args: any[]): Omit<A, 'withArgs'> & Agent<A>
  }

  interface CookieDefaults {
    whitelist: string | string[] | RegExp | ((cookie: any) => boolean)
  }

  /**
   * Options that control how a command is logged in the Reporter
   */
  interface Loggable {
    /**
     * Displays the command in the Command Log
     *
     * @default true
     */
    log: boolean
  }

  /**
   * Options that control how long Test Runner is waiting for command to succeed
   */
  interface Timeoutable {
    /**
     * Time to wait (ms)
     *
     * @default defaultCommandTimeout
     * @see https://docs.cypress.io/guides/references/configuration.html#Timeouts
     */
    timeout: number
  }

  /**
   * Options to force an event, skipping Actionability check
   * @see https://docs.cypress.io/guides/core-concepts/interacting-with-elements.html#Actionability
   */
  interface Forceable {
    /**
     * Forces the action, disables waiting for actionability
     *
     * @default false
     */
    force: boolean
  }

  interface BlurOptions extends Loggable, Forceable { }

  interface CheckOptions extends Loggable, Timeoutable, Forceable {
    interval: number
  }

  interface ClearOptions extends Loggable, Timeoutable, Forceable {
    interval: number
  }

  /**
   * Object to change the default behavior of .click().
   */
  interface ClickOptions extends Loggable, Timeoutable, Forceable {
    /**
     * Serially click multiple elements
     *
     * @default false
     */
    multiple: boolean
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

  interface DebugOptions {
    verbose: boolean
  }

  /**
   * Options object to change the default behavior of cy.exec().
   */
  interface ExecOptions extends Loggable, Timeoutable {
    /**
     * Whether to fail if the command exits with a non-zero code
     *
     * @default true
     */
    failOnNonZeroExit: boolean
    /**
     * Object of environment variables to set before the command executes
     * (e.g. {USERNAME: 'johndoe'}). Will be merged with existing
     * system environment variables
     *
     * @default {}
     */
    env: object
  }

  interface RequestOptions extends Loggable, Timeoutable {
    auth: object
    body: RequestBody
    failOnStatusCode: boolean
    followRedirect: boolean
    form: boolean
    gzip: boolean
    headers: object
    method: HttpMethod
    qs: string
    url: string
  }

  interface RouteOptions {
    method: HttpMethod
    url: string | RegExp
    response: any
    status: number
    delay: number
    headers: object | null
    force404: boolean
    onRequest(...args: any[]): void
    onResponse(...args: any[]): void
    onAbort(...args: any[]): void
  }

  interface ScrollToOptions extends Loggable, Timeoutable {
    /**
     * Scrolls over the duration (in ms)
     *
     * @default 0
     */
    duration: number
    /**
     * Will scroll with the easing animation
     *
     * @default 'swing'
     */
    easing: 'swing' | 'linear'
  }

  interface SelectOptions extends Loggable, Timeoutable, Forceable {
    interval: number
  }

  interface ServerOptions {
    delay: number
    method: HttpMethod
    status: number
    headers: object
    response: any
    onRequest(...args: any[]): void
    onResponse(...args: any[]): void
    onAbort(...args: any[]): void
    enable: boolean
    force404: boolean
    urlMatchingOptions: object
    whitelist(...args: any[]): void
  }

  interface SetCookieOptions extends Loggable, Timeoutable {
    path: string
    domain: string
    secure: boolean
    httpOnly: boolean
    expiry: number
  }

  /**
   * Options that control `cy.type` command
   *
   * @see https://on.cypress.io/type
   */
  interface TypeOptions extends Loggable, Timeoutable {
    /**
     * Delay after each keypress (ms)
     *
     * @default 10
     */
    delay: number
    /**
     * Forces the action, disables waiting for actionability
     *
     * @default false
     */
    force: boolean
    /**
     * Keep a modifier activated between commands
     *
     * @default true
     */
    release: boolean
  }

  /**
   * Visit website options
   *
   * @see https://on.cypress.io/visit
   */
  interface VisitOptions extends Loggable, Timeoutable {
    /**
     * Called before your page has loaded all of its resources.
     *
     * @param {Window} contentWindow the remote page's window object
     */
    onBeforeLoad(win: Window): void

    /**
     * Called once your page has fired its load event.
     *
     * @param {Window} contentWindow the remote page's window object
     */
    onLoad(win: Window): void

    /**
     * Whether to fail on response codes other than 2xx and 3xx
     *
     * @default {true}
     */
    failOnStatusCode: boolean
  }

  /**
   * Options to change the default behavior of .trigger()
   */
  interface TriggerOptions extends Loggable, Timeoutable, Forceable {
    /**
     * Whether the event bubbles
     *
     * @default true
     */
    bubbles: boolean
    /**
     * Whether the event is cancelable
     *
     * @default true
     */
    cancable: boolean
  }

  interface Chainer<Subject> {
    (chainers: string, value?: any): Chainable<Subject>
    (chainers: string, method: string, value: any): Chainable<Subject>
    (fn: (currentSubject: Subject) => void): Chainable<Subject>
  }

  /**
   * The clock starts at the unix epoch (timestamp of 0). This means that when you instantiate new Date in your application, it will have a time of January 1st, 1970.
   */
  interface Clock {
    /**
     * Move the clock the specified number of `milliseconds`.
     * Any timers within the affected range of time will be called.
     * @param time Number in ms to advance the clock
     */
    tick(time: number): void
    /**
     * Restore all overridden native functions. This is automatically called between tests, so should not generally be needed.
     */
    restore(): void
  }

  interface Cookie {
    name: string
    value: string
    path: string
    domain: string
    httpOnly: boolean
    secure: boolean
    expiry?: string
  }

  interface Exec {
    code: number
    stdout: string
    stderr: string
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

  interface Response {
    allRequestResponses: any[]
    body: any
    duration: number
    headers: { [key: string]: string }
    isOkStatusCode: boolean
    redirectedToUrl: string
    requestHeaders: { [key: string]: string }
    status: number
    statusText: string
  }

  interface Server extends RouteOptions {
    enable: boolean
    whitelist: (xhr: any) => boolean
  }

  interface WaitXHR {
    duration: number
    id: string
    method: HttpMethod
    request: {
      body: string | ObjectLike
      headers: ObjectLike
    }
    requestBody: WaitXHR['request']['body']
    requestHeaders: WaitXHR['request']['headers']
    response: {
      body: string | ObjectLike
      headers: ObjectLike
    }
    responseBody: WaitXHR['response']['body']
    responseHeaders: WaitXHR['response']['headers']
    status: number
    statusMessage: string
    url: string
    xhr: XMLHttpRequest
  }

  type Encodings = 'ascii' | 'base64' | 'binary' | 'hex' | 'latin1' | 'utf8' | 'utf-8' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le'
  type PositionType = "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight"
  type ViewportPreset = 'macbook-15' | 'macbook-13' | 'macbook-11' | 'ipad-2' | 'ipad-mini' | 'iphone-6+' | 'iphone-6' | 'iphone-5' | 'iphone-4' | 'iphone-3'

  // Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
  type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T]
  type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>
}

// global variables added by Cypress when it runs
declare const cy: Cypress.Chainable<undefined>
declare const Cypress: Cypress.Cypress
