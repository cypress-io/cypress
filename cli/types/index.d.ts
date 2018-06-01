// Project: https://www.cypress.io
// GitHub:  https://github.com/cypress-io/cypress
// Definitions by: Gert Hengeveld <https://github.com/ghengeveld>
//                 Mike Woudenberg <https://github.com/mikewoudenberg>
//                 Robbert van Markus <https://github.com/rvanmarkus>
//                 Nicholas Boll <https://github.com/nicholasboll>
// TypeScript Version: 2.5
// Updated by the Cypress team: https://www.cypress.io/about/

/// <reference path="./blob-util.d.ts" />
/// <reference path="./bluebird.d.ts" />
/// <reference path="./minimatch.d.ts" />

/// <reference types="chai" />
/// <reference types="chai-jquery" />
/// <reference types="jquery" />
/// <reference types="lodash" />
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

  interface CommandOptions {
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
    minimatch: Mimimatch.MimimatchStatic
    /**
     * Cypress automatically includes moment.js and exposes it as Cypress.moment.
     *
     * @see https://on.cypress.io/moment
     * @see http://momentjs.com/
     * @example
     *    const todaysDate = Cypress.moment().format("MMM DD, YYYY")
     */
    moment: (...args: any[]) => any // perhaps we want to add moment as a dependency for types?
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
     * Cypress version string. i.e. "1.1.2"
     * @see https://on.cypress.io/version
     * @example
     *    expect(Cypress.version).to.be.a('string')
     *    if (Cypress.version === '1.2.0') {
     *       // test something specific
     *    }
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

    log(options: Partial<LogConfig>): Log

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

    /**
     * @see https://on.cypress.io/api/screenshot-api
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
    off: Actions
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
     * You can alias DOM elements, routes, stubs and spies.
     *
     * @see https://on.cypress.io/as
     * @see https://on.cypress.io/variables-and-aliases
     * @see https://on.cypress.io/get
     * @example
     *    // Get the aliased ‘todos’ elements
     *    cy.get('ul#todos').as('todos')
     *    //...hack hack hack...
     *    // later retrieve the todos
     *    cy.get('@todos')
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
     * @example
     *    // Check checkbox element
     *    cy.get('[type="checkbox"]').check()
     *    // Check first radio element
     *    cy.get('[type="radio"]').first().check()
     */
    check(options?: Partial<CheckOptions>): Chainable<Subject>
    /**
     * Check checkbox(es) or radio(s). This element must be an `<input>` with type `checkbox` or `radio`.
     *
     * @see https://on.cypress.io/check
     * @example
     *    // Select the radio with the value of ‘US’
     *    cy.get('[type="radio"]').check('US')
     *    // Check the checkboxes with the values ‘ga’ and ‘ca’
     *    cy.get('[type="checkbox"]').check(['ga', 'ca'])
     */
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
     * @example
     *    cy.get('button').click()          // Click on button
     *    cy.focused().click()              // Click on el with focus
     *    cy.contains('Welcome').click()    // Click on first el containing 'Welcome'
     */
    click(options?: Partial<ClickOptions>): Chainable<Subject>
    /**
     * Click a DOM element at specific corner / side.
     *
     * @param {String} position The position where the click should be issued. The `center` position is the default position.
     * @see https://on.cypress.io/click
     * @example
     *    cy.get('button').click('topRight')
     */
    click(position: string, options?: Partial<ClickOptions>): Chainable<Subject>
    /**
     * Click a DOM element at specific coordinates
     *
     * @param {number} x The distance in pixels from the element’s left to issue the click.
     * @param {number} y The distance in pixels from the element’s top to issue the click.
     * @see https://on.cypress.io/click
     * @example
     *    // The click below will be issued inside of the element
     *    // (15px from the left and 40px from the top).
     *    cy.get('button').click(15, 40)
     */
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
     * @example
     *    // Yield el in .nav containing 'About'
     *    cy.get('.nav').contains('About')
     *    // Yield first el in document containing 'Hello'
     *    cy.contains('Hello')
     *    // you can use regular expression
     *    cy.contains(/^b\w+/)
     *    // yields <ul>...</ul>
     *    cy.contains('ul', 'apples')
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
     * @example
     *    cy.document()
     *      .its('contentType')
     *      .should('eq', 'text/html')
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
     * @param {Number} index A number indicating the index to find the element at within an array of elements. A negative number counts index from the end of the list.
     * @example
     *    cy.get('tbody>tr').eq(0)    // Yield first 'tr' in 'tbody'
     *    cy.get('ul>li').eq('4')     // Yield fifth 'li' in 'ul'
     *    cy.get('li').eq(-2) // Yields second from last 'li' element
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
    filter<E extends Node = HTMLElement>(fn: (index: number, element: E) => boolean, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>

    /**
     * Get the descendent DOM elements of a specific selector.
     *
     * @see https://on.cypress.io/find
     * @example
     *    cy.get('.article').find('footer') // Yield 'footer' within '.article'
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
     * @example
     *    // Get the element that is focused
     *    cy.focused().then(function($el) {
     *       // do something with $el
     *    })
     *    // Blur the element with focus
     *    cy.focused().blur()
     *    // Make an assertion on the focused element
     *    cy.focused().should('have.attr', 'name', 'username')
     */
    focused(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>

    /**
     * Get one or more DOM elements by node name: input, button, etc.
     * @see https://on.cypress.io/get
     * @example
     *    cy.get('input').should('be.disabled')
     *    cy.get('button').should('be.visible')
     */
    get<K extends keyof HTMLElementTagNameMap>(selector: K, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElementTagNameMap[K]>>
    /**
     * Get one or more DOM elements by selector.
     * The querying behavior of this command matches exactly how $(…) works in jQuery.
     * @see https://on.cypress.io/get
     * @example
     *    cy.get('.list>li')    // Yield the <li>'s in <.list>
     *    cy.get('ul li:first').should('have.class', 'active')
     *    cy.get('.dropdown-menu').click()
     */
    get<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
    /**
     * Get one or more DOM elements by alias.
     * @see https://on.cypress.io/get#Alias
     * @example
     *    // Get the aliased ‘todos’ elements
     *    cy.get('ul#todos').as('todos')
     *    //...hack hack hack...
     *    //later retrieve the todos
     *    cy.get('@todos')
     */
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
     * These events come from Cypress as it issues commands and reacts to their state. These are all useful to listen to for debugging purposes.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    on: Actions

    /**
     * These events come from Cypress as it issues commands and reacts to their state. These are all useful to listen to for debugging purposes.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    off: Actions

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
     * @example
     *    cy.reload()
     */
    reload(options?: Partial<Loggable & Timeoutable>): Chainable<Window>
    /**
     * Reload the page without cache
     *
     * @see https://on.cypress.io/reload
     * @param {Boolean} forceReload Whether to reload the current page without using the cache. true forces the reload without cache.
     * @example
     *    // Reload the page without using the cache
     *    cy.visit('http://localhost:3000/admin')
     *    cy.reload(true)
     */
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
    screenshot(fileName: string, options?: Partial<Loggable & Timeoutable & ScreenshotOptions>): Chainable<null>

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
     * Run a task in Node via the plugins file.
     *
     * @see https://on.cypress.io/task
     */
    task(event: string, arg?: any, options?: Partial<Loggable & Timeoutable>): Chainable<Subject>

    /**
     * Enables you to work with the subject yielded from the previous command.
     *
     * @see https://on.cypress.io/then
     */
    then<S>(fn: (this: ObjectLike, currentSubject: Subject) => Chainable<S>, options?: Partial<Timeoutable>): Chainable<S>
    then<S>(fn: (this: ObjectLike, currentSubject: Subject) => PromiseLike<S>, options?: Partial<Timeoutable>): Chainable<S>
    then<S extends object | any[] | string | number | boolean>(fn: (this: ObjectLike, currentSubject: Subject) => S, options?: Partial<Timeoutable>): Chainable<S>
    /**
     * Enables you to work with the subject yielded from the previous command.
     *
     * @see https://on.cypress.io/then
     * @example
     *    cy.get('.nav').then(($nav) => {})  // Yields .nav as first arg
     *    cy.location().then((loc) => {})   // Yields location object as first arg
     */
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
     * @example
     *    cy.get('input').type('Hello, World')
     *    // type "hello" + press Enter
     *    cy.get('input').type('hello{enter}')
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
     * @example
     *    cy.visit('http://localhost:3000')
     *    cy.visit('/somewhere') // opens ${baseUrl}/somewhere
     *
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
     * @example
     *    cy.visit('http://localhost:8080/app')
     *    cy.window().then(function(win){
     *      // win is the remote window
     *      // of the page at: http://localhost:8080/app
     *    })
     */
    window(options?: Partial<Loggable & Timeoutable>): Chainable<Window>

    /**
     * Scopes all subsequent cy commands to within this element. Useful when working within a particular group of elements such as a `<form>`.
     * @see https://on.cypress.io/within
     * @example
     *    cy.get('form').within(($form) => {
     *      // cy.get() will only search for elements within form,
     *      // not within the entire document
     *      cy.get('input[name="username"]').type('john')
     *      cy.get('input[name="password"]').type('password')
     *      cy.root().submit()
     *    })
     *
     */
    within(fn: (currentSubject: Subject) => void): Chainable<Subject>
    within(options: Partial<Loggable>, fn: (currentSubject: Subject) => void): Chainable<Subject> // inconsistent argument order

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
    trashAssetsBeforeRuns: boolean
    /**
     * The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be false to disable compression or a value between 0 and 51, where a lower value results in better quality (at the expense of a higher file size).
     * @default 32
     */
    videoCompression: number
    /**
     * Whether Cypress will record a video of the test run when running headlessly.
     * @default true
     */
    video: boolean
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

  interface Dimensions {
    x: number
    y: number
    width: number
    height: number
  }

  interface ScreenshotOptions {
    blackout: string[]
    capture: 'runner' | 'viewport' | 'fullPage'
    clip: Dimensions
    disableTimersAndAnimations: boolean
    scale: boolean
    beforeScreenshot(doc: Document): void
    afterScreenshot(doc: Document): void
  }

  interface ScreenshotDefaultsOptions extends ScreenshotOptions {
    screenshotOnRunFailure: boolean
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
    easing: 'swing' | 'linear',
  }

  interface ScrollIntoViewOptions extends ScrollToOptions {
    /**
     * Amount to scroll after the element has been scrolled into view
     *
     * @default {top: 0, left: 0}
     */
    offset: Offset
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

  // Kind of onerous, but has a nice auto-complete. Also fallbacks at the end for custom stuff
  /**
   * @see https://on.cypress.io/should
   *
   * @interface Chainer
   * @template Subject
   */
  interface Chainer<Subject> {
    // chai
    /**
     * Asserts that the target’s `type` is equal to the given string type.
     * Types are case insensitive. See the `type-detect` project page for info on the type detection algorithm:
     * https://github.com/chaijs/type-detect.
     * @example
     *    cy.wrap('foo').should('be.a', 'string')
     * @see http://chaijs.com/api/bdd/#method_a
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.a', type: string): Chainable<Subject>
    /**
     * Asserts that the target is a number or a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.above', 5)
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.above', value: number | Date): Chainable<Subject>
    /**
     * Asserts that the target’s `type` is equal to the given string type.
     * Types are case insensitive. See the `type-detect` project page for info on the type detection algorithm:
     * https://github.com/chaijs/type-detect.
     * @example
     *    cy.wrap({ foo: 'bar' }).should('be.an', 'object')
     * @alias a
     * @see http://chaijs.com/api/bdd/#method_a
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.an', value: string): Chainable<Subject>
    /**
     * Asserts that the target is a number or a `n` date greater than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.at.least', 5)
     * @see http://chaijs.com/api/bdd/#method_least
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.at.least', value: number | Date): Chainable<Subject>
    /**
     * Asserts that the target is a number or a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('be.below', 5)
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.below', value: number): Chainable<Subject>
    /**
     * Asserts that the target is an `arguments` object.
     * @example
     *    cy.wrap(arguments).should('be.arguments')
     * @see http://chaijs.com/api/bdd/#method_arguments
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.arguments'): Chainable<Subject>
    /**
     * Asserts that the target is a number that’s within a given +/- `delta` range of the given number `expected`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(5.1).should('be.approximately', 5, 0.5)
     * @alias closeTo
     * @see http://chaijs.com/api/bdd/#method_closeto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.approximately', value: number, delta: number): Chainable<Subject>
    /**
     * Asserts that the target is a number that’s within a given +/- `delta` range of the given number `expected`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(5.1).should('be.closeTo', 5, 0.5)
     * @see http://chaijs.com/api/bdd/#method_closeto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.closeTo', value: number, delta: number): Chainable<Subject>
    /**
     * When the target is a string or array, .empty asserts that the target’s length property is strictly (===) equal to 0
     * @example
     *    cy.wrap([]).should('be.empty')
     *    cy.wrap('').should('be.empty')
     * @see http://chaijs.com/api/bdd/#method_empty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.empty'): Chainable<Subject>
    /**
     * Asserts that the target is an instance of the given `constructor`.
     * @example
     *    cy.wrap([1, 2]).should('be.instanceOf', Array)
     * @see http://chaijs.com/api/bdd/#method_instanceof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.instanceOf', value: any): Chainable<Subject>
    /**
     * Asserts that the target is strictly (`===`) equal to `false`.
     * @example
     *    cy.wrap(false).should('be.false')
     * @see http://chaijs.com/api/bdd/#method_false
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.false'): Chainable<Subject>
    /**
     * Asserts that the target is a number or a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.greaterThan', 5)
     * @alias above
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.greaterThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a number or a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.gt', 5)
     * @alias above
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.gt', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a number or a `n` date greater than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.gte', 5)
     * @alias least
     * @see http://chaijs.com/api/bdd/#method_least
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.gte', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a number or a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('be.lessThan', 5)
     * @alias below
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.lessThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a number or a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('be.lt', 5)
     * @alias below
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.lt', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a number or a date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('be.lte', 5)
     * @alias most
     * @see http://chaijs.com/api/bdd/#method_most
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.lte', value: number): Chainable<Subject>
    /**
     * Asserts that the target is loosely (`==`) equal to `true`. However, it’s often best to assert that the target is strictly (`===`) or deeply equal to its expected value.
     * @example
     *    cy.wrap(1).should('be.ok')
     * @see http://chaijs.com/api/bdd/#method_ok
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.ok'): Chainable<Subject>
    /**
     * Asserts that the target is strictly (`===`) equal to true.
     * @example
     *    cy.wrap(true).should('be.true')
     * @see http://chaijs.com/api/bdd/#method_true
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.true'): Chainable<Subject>
    /**
     * Asserts that the target is strictly (`===`) equal to undefined.
     * @example
     *    cy.wrap(undefined).should('be.undefined')
     * @see http://chaijs.com/api/bdd/#method_undefined
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.undefined'): Chainable<Subject>
    /**
     * Asserts that the target is a number or a date greater than or equal to the given number or date `start`, and less than or equal to the given number or date `finish` respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.within', 5, 10)
     * @see http://chaijs.com/api/bdd/#method_within
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.within', start: number, end: number): Chainable<Subject>
    (chainer: 'be.within', start: Date, end: Date): Chainable<Subject>
    /**
     * When one argument is provided, `.change` asserts that the given function `subject` returns a different value when it’s invoked before the target function compared to when it’s invoked afterward.
     * However, it’s often best to assert that `subject` is equal to its expected value.
     * @example
     *    let dots = ''
     *    function addDot() { dots += '.' }
     *    function getDots() { return dots }
     *    cy.wrap(addDot).should('change', getDots)
     * @see http://chaijs.com/api/bdd/#method_change
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'change', fn: (...args: any[]) => any): Chainable<Subject>
    /**
     * When two arguments are provided, `.change` asserts that the value of the given object `subject`'s `prop` property is different before invoking the target function compared to afterward.
     * @example
     *    const myObj = { dots: '' }
     *    function addDot() { myObj.dots += '.' }
     *    cy.wrap(addDot).should('change', myObj, 'dots')
     * @see http://chaijs.com/api/bdd/#method_change
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'change', obj: object, prop: string): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string val is a substring of the target.
     * @example
     *    cy.wrap('tester').should('contain', 'test')
     * @alias include
     * @see http://chaijs.com/api/bdd/#method_include
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'contain', value: any): Chainable<Subject>
    /**
     * When one argument is provided, `.decrease` asserts that the given function `subject` returns a lesser number when it’s invoked after invoking the target function compared to when it’s invoked beforehand.
     * `.decrease` also causes all `.by` assertions that follow in the chain to assert how much lesser of a number is returned. It’s often best to assert that the return value decreased by the expected amount, rather than asserting it decreased by any amount.
     * @example
     *    let val = 1
     *    function subtractTwo() { val -= 2 }
     *    function getVal() { return val }
     *    cy.wrap(subtractTwo).should('decrease', getVal)
     * @see http://chaijs.com/api/bdd/#method_decrease
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'decrease', fn: (...args: any[]) => any): Chainable<Subject>
    /**
     * When two arguments are provided, `.decrease` asserts that the value of the given object `subject`'s `prop` property is lesser after invoking the target function compared to beforehand.
     * @example
     *    let val = 1
     *    function subtractTwo() { val -= 2 }
     *    function getVal() { return val }
     *    cy.wrap(subtractTwo).should('decrease', getVal)
     * @see http://chaijs.com/api/bdd/#method_decrease
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'decrease', obj: object, prop: string): Chainable<Subject>
    /**
     * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property` assertions that follow in the chain to use deep equality instead of strict (`===`) equality. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({ a: 1 }).should('deep.equal', { a: 1 })
     * @see http://chaijs.com/api/bdd/#method_deep
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'deep.equal', value: Subject): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to either `null` or `undefined`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(1).should('exist')
     * @see http://chaijs.com/api/bdd/#method_exist
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'exist'): Chainable<Subject>
    /**
     * Asserts that the target is strictly (`===`) equal to the given `val`.
     * @example
     *    cy.wrap(1).should('eq', 1)
     * @alias equal
     * @see http://chaijs.com/api/bdd/#method_equal
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'eq', value: any): Chainable<Subject>
    /**
     * Asserts that the target is deeply equal to the given `obj`. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({a: 1}).should('eql', {a: 1}).and('not.equal', {a: 1})
     * @see http://chaijs.com/api/bdd/#method_eql
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'eql', value: any): Chainable<Subject>
    /**
     * Asserts that the target is strictly (`===`) equal to the given `val`.
     * @example
     *    cy.wrap(1).should('equal', 1)
     * @see http://chaijs.com/api/bdd/#method_equal
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'equal', value: any): Chainable<Subject>
    /**
     * Causes all `.keys` assertions that follow in the chain to require that the target have all of the given keys. This is the opposite of `.any`, which only requires that the target have at least one of the given keys.
     * @example
     *    cy.wrap({ a: 1, b: 2 }).should('have.all.keys', 'a', 'b')
     * @see http://chaijs.com/api/bdd/#method_all
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.all.keys', ...value: string[]): Chainable<Subject>
    /**
     * Causes all `.keys` assertions that follow in the chain to only require that the target have at least one of the given keys. This is the opposite of `.all`, which requires that the target have all of the given keys.
     * @example
     *    cy.wrap({ a: 1, b: 2 }).should('have.any.keys', 'a')
     * @see http://chaijs.com/api/bdd/#method_any
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.any.keys', ...value: string[]): Chainable<Subject>
    /**
     * Asserts that the target has a property with the given key `name`. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({ x: {a: 1 }}).should('have.deep.property', 'x', { a: 1 })
     * @see http://chaijs.com/api/bdd/#method_property
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.deep.property', value: string, obj: object): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length', 3)
     *    cy.wrap('foo').should('have.length', 3)
     * @alias lengthOf
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is greater than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.greaterThan', 2)
     *    cy.wrap('foo').should('have.length.greaterThan', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.greaterThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is greater than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.gt', 2)
     *    cy.wrap('foo').should('have.length.gt', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.gt', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is greater than or equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.gte', 2)
     *    cy.wrap('foo').should('have.length.gte', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.gte', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is less than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.lessThan', 4)
     *    cy.wrap('foo').should('have.length.lessThan', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.lessThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is less than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.lt', 4)
     *    cy.wrap('foo').should('have.length.lt', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.lt', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is less than or equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.lte', 4)
     *    cy.wrap('foo').should('have.length.lte', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.lte', value: number): Chainable<Subject>
    /**
     * Asserts that the target array has the same members as the given array `set`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.members', [2, 1, 3])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.members', values: any[]): Chainable<Subject>
    /**
     * Asserts that the target array has the same members as the given array where order matters.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.ordered.members', [1, 2, 3])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.ordered.members', values: any[]): Chainable<Subject>
    /**
     * Causes all `.property` and `.include` assertions that follow in the chain to ignore inherited properties.
     * @example
     *    Object.prototype.b = 2
     *    cy.wrap({ a: 1 }).should('have.property', 'a').and('not.have.ownProperty', 'b')
     * @see http://chaijs.com/api/bdd/#method_ownproperty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.ownProperty', property: string): Chainable<Subject>
    /**
     * Asserts that the target has a property with the given key `name`.
     * @example
     *    cy.wrap({ a: 1 }).should('have.property', 'a')
     *    cy.wrap({ a: 1 }).should('have.property', 'a', 1)
     * @see http://chaijs.com/api/bdd/#method_property
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.property', property: string, value?: any): Chainable<Subject>
    /**
     * Asserts that the target string contains the given substring `str`.
     * @example
     *    cy.wrap('foobar').should('have.string', 'bar')
     * @see http://chaijs.com/api/bdd/#method_string
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.string', match: string | RegExp): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string `val` is a substring of the target.
     * @example
     *    cy.wrap('foobar').should('include', 'foo')
     * @see http://chaijs.com/api/bdd/#method_include
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'include', value: any): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string `val` is a substring of the target.
     * @example
     *    cy.wrap([1, 2, 3]).should('include.members', [1, 2])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'include.members', value: any[]): Chainable<Subject>
    /**
     * When one argument is provided, `.increase` asserts that the given function `subject` returns a greater number when it’s
     * invoked after invoking the target function compared to when it’s invoked beforehand.
     * `.increase` also causes all `.by` assertions that follow in the chain to assert how much greater of a number is returned.
     * It’s often best to assert that the return value increased by the expected amount, rather than asserting it increased by any amount.
     * @example
     *    let val = 1
     *    function addTwo() { val += 2 }
     *    function getVal() { return val }
     *    cy.wrap(addTwo).should('increase', getVal)
     * @see http://chaijs.com/api/bdd/#method_increase
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'increase', value: object, property: string): Chainable<Subject>
    /**
     * Asserts that the target matches the given regular expression `re`.
     * @example
     *    cy.wrap('foobar').should('match', /^foo/)
     * @see http://chaijs.com/api/bdd/#method_match
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'match', value: string | RegExp): Chainable<Subject>
    /**
     * When the target is a non-function object, `.respondTo` asserts that the target has a `method` with the given name method. The method can be own or inherited, and it can be enumerable or non-enumerable.
     * @example
     *    class Cat {
     *      meow() {}
     *    }
     *    cy.wrap(new Cat()).should('respondTo', 'meow')
     * @see http://chaijs.com/api/bdd/#method_respondto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'respondTo', value: string): Chainable<Subject>
    /**
     * Invokes the given `matcher` function with the target being passed as the first argument, and asserts that the value returned is truthy.
     * @example
     *    cy.wrap(1).should('satisfy', (num) => num > 0)
     * @see http://chaijs.com/api/bdd/#method_satisfy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'satisfy', fn: (val: any) => boolean): Chainable<Subject>
    /**
     * When no arguments are provided, `.throw` invokes the target function and asserts that an error is thrown.
     * When one argument is provided, and it’s a string, `.throw` invokes the target function and asserts that an error is thrown with a message that contains that string.
     * @example
     *    function badFn() { throw new TypeError('Illegal salmon!') }
     *    cy.wrap(badFn).should('throw')
     *    cy.wrap(badFn).should('throw', 'salmon')
     *    cy.wrap(badFn).should('throw', /salmon/)
     * @see http://chaijs.com/api/bdd/#method_throw
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'throw', value?: string | RegExp): Chainable<Subject>
    /**
     * When no arguments are provided, `.throw` invokes the target function and asserts that an error is thrown.
     * When one argument is provided, and it’s a string, `.throw` invokes the target function and asserts that an error is thrown with a message that contains that string.
     * @example
     *    function badFn() { throw new TypeError('Illegal salmon!') }
     *    cy.wrap(badFn).should('throw')
     *    cy.wrap(badFn).should('throw', 'salmon')
     *    cy.wrap(badFn).should('throw', /salmon/)
     * @see http://chaijs.com/api/bdd/#method_throw
     * @see https://on.cypress.io/assertions
     */
    // tslint:disable-next-line ban-types
    (chainer: 'throw', error: Error | Function, expected?: string | RegExp): Chainable<Subject>

    // chai.not
    /**
     * Asserts that the target’s `type` is not equal to the given string type.
     * Types are case insensitive. See the `type-detect` project page for info on the type detection algorithm:
     * https://github.com/chaijs/type-detect.
     * @example
     *    cy.wrap('foo').should('not.be.a', 'number')
     * @see http://chaijs.com/api/bdd/#method_a
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.a', type: string): Chainable<Subject>
    /**
     * Asserts that the target is a not number or not a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('not.be.above', 10)
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.above', value: number | Date): Chainable<Subject>
    /**
     * Asserts that the target’s `type` is not equal to the given string type.
     * Types are case insensitive. See the `type-detect` project page for info on the type detection algorithm:
     * https://github.com/chaijs/type-detect.
     * @example
     *    cy.wrap('foo').should('not.be.an', 'object')
     * @alias a
     * @see http://chaijs.com/api/bdd/#method_a
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.an', value: string): Chainable<Subject>
    /**
     * Asserts that the target is not a number or not a `n` date greater than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('not.be.at.least', 10)
     * @see http://chaijs.com/api/bdd/#method_least
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.at.least', value: number | Date): Chainable<Subject>
    /**
     * Asserts that the target is not a number or not a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('not.be.below', 1)
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.below', value: number): Chainable<Subject>
    /**
     * Asserts that the target is not an `arguments` object.
     * @example
     *    cy.wrap(1).should('not.be.arguments')
     * @see http://chaijs.com/api/bdd/#method_arguments
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.arguments'): Chainable<Subject>
    /**
     * Asserts that the target is a not number that’s within a given +/- `delta` range of the given number `expected`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(5.1).should('not.be.approximately', 6, 0.5)
     * @alias closeTo
     * @see http://chaijs.com/api/bdd/#method_closeto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.approximately', value: number, delta: number): Chainable<Subject>
    /**
     * Asserts that the target is not a number that’s within a given +/- `delta` range of the given number `expected`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(5.1).should('not.be.closeTo', 6, 0.5)
     * @see http://chaijs.com/api/bdd/#method_closeto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.closeTo', value: number, delta: number): Chainable<Subject>
    /**
     * When the target is a not string or array, .empty asserts that the target’s length property is strictly (===) equal to 0
     * @example
     *    cy.wrap([1]).should('not.be.empty')
     *    cy.wrap('foo').should('not.be.empty')
     * @see http://chaijs.com/api/bdd/#method_empty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.empty'): Chainable<Subject>
    /**
     * Asserts that the target is not an instance of the given `constructor`.
     * @example
     *    cy.wrap([1, 2]).should('not.be.instanceOf', String)
     * @see http://chaijs.com/api/bdd/#method_instanceof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.instanceOf', value: any): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to `false`.
     * @example
     *    cy.wrap(true).should('not.be.false')
     * @see http://chaijs.com/api/bdd/#method_false
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.false'): Chainable<Subject>
    /**
     * Asserts that the target is a not number or a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('be.greaterThan', 7)
     * @alias above
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.greaterThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a not number or a date greater than the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('not.be.gt', 7)
     * @alias above
     * @see http://chaijs.com/api/bdd/#method_above
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.gt', value: number): Chainable<Subject>
    /**
     * Asserts that the target is a not number or a `n` date greater than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(6).should('not.be.gte', 7)
     * @alias least
     * @see http://chaijs.com/api/bdd/#method_least
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.gte', value: number): Chainable<Subject>
    /**
     * Asserts that the target is not a number or a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('not.be.lessThan', 3)
     * @alias below
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.lessThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target is not a number or a `n` date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('not.be.lt', 3)
     * @alias below
     * @see http://chaijs.com/api/bdd/#method_below
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.lt', value: number): Chainable<Subject>
    /**
     * Asserts that the target is not a number or a date less than or equal to the given number or date n respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(4).should('not.be.lte', 3)
     * @alias most
     * @see http://chaijs.com/api/bdd/#method_most
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.lte', value: number): Chainable<Subject>
    /**
     * Asserts that the target is not loosely (`==`) equal to `true`. However, it’s often best to assert that the target is strictly (`===`) or deeply equal to its expected value.
     * @example
     *    cy.wrap(0).should('not.be.ok')
     * @see http://chaijs.com/api/bdd/#method_ok
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.ok'): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to true.
     * @example
     *    cy.wrap(false).should('not.be.true')
     * @see http://chaijs.com/api/bdd/#method_true
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.true'): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to undefined.
     * @example
     *    cy.wrap(true).should('not.be.undefined')
     * @see http://chaijs.com/api/bdd/#method_undefined
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.undefined'): Chainable<Subject>
    /**
     * Asserts that the target is not a number or a date greater than or equal to the given number or date `start`, and less than or equal to the given number or date `finish` respectively.
     * However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(3).should('not.be.within', 5, 10)
     * @see http://chaijs.com/api/bdd/#method_within
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.within', start: number, end: number): Chainable<Subject>
    (chainer: 'not.be.within', start: Date, end: Date): Chainable<Subject>
    /**
     * When one argument is provided, `.change` asserts that the given function `subject` returns a different value when it’s invoked before the target function compared to when it’s invoked afterward.
     * However, it’s often best to assert that `subject` is equal to its expected value.
     * @example
     *    let dots = ''
     *    function addDot() { dots += '.' }
     *    function getDots() { return dots }
     *    cy.wrap(() => {}).should('not.change', getDots)
     * @see http://chaijs.com/api/bdd/#method_change
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.change', fn: (...args: any[]) => any): Chainable<Subject>
    /**
     * When two arguments are provided, `.change` asserts that the value of the given object `subject`'s `prop` property is different before invoking the target function compared to afterward.
     * @example
     *    const myObj = { dots: '' }
     *    function addDot() { myObj.dots += '.' }
     *    cy.wrap(() => {}).should('not.change', myObj, 'dots')
     * @see http://chaijs.com/api/bdd/#method_change
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.change', obj: object, prop: string): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string val is a substring of the target.
     * @example
     *    cy.wrap('tester').should('not.contain', 'foo')
     * @alias include
     * @see http://chaijs.com/api/bdd/#method_include
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.contain', value: any): Chainable<Subject>
    /**
     * When one argument is provided, `.decrease` asserts that the given function `subject` does not returns a lesser number when it’s invoked after invoking the target function compared to when it’s invoked beforehand.
     * `.decrease` also causes all `.by` assertions that follow in the chain to assert how much lesser of a number is returned. It’s often best to assert that the return value decreased by the expected amount, rather than asserting it decreased by any amount.
     * @example
     *    let val = 1
     *    function subtractTwo() { val -= 2 }
     *    function getVal() { return val }
     *    cy.wrap(() => {}).should('not.decrease', getVal)
     * @see http://chaijs.com/api/bdd/#method_decrease
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.decrease', fn: (...args: any[]) => any): Chainable<Subject>
    /**
     * When two arguments are provided, `.decrease` asserts that the value of the given object `subject`'s `prop` property is not lesser after invoking the target function compared to beforehand.
     * @example
     *    const myObj = { val: 1 }
     *    function subtractTwo() { myObj.val -= 2 }
     *    cy.wrap(() => {}).should('not.decrease', myObj, 'val')
     * @see http://chaijs.com/api/bdd/#method_decrease
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.decrease', obj: object, prop: string): Chainable<Subject>
    /**
     * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property` assertions that follow in the chain to not use deep equality instead of strict (`===`) equality. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({ a: 1 }).should('not.deep.equal', { b: 1 })
     * @see http://chaijs.com/api/bdd/#method_deep
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.deep.equal', value: Subject): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to either `null` or `undefined`. However, it’s often best to assert that the target is equal to its expected value.
     * @example
     *    cy.wrap(null).should('not.exist')
     * @see http://chaijs.com/api/bdd/#method_exist
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.exist'): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to the given `val`.
     * @example
     *    cy.wrap(1).should('not.eq', 2)
     * @alias equal
     * @see http://chaijs.com/api/bdd/#method_equal
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.eq', value: any): Chainable<Subject>
    /**
     * Asserts that the target is not deeply equal to the given `obj`. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({a: 1}).should('not.eql', {c: 1}).and('not.equal', {a: 1})
     * @see http://chaijs.com/api/bdd/#method_eql
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.eql', value: any): Chainable<Subject>
    /**
     * Asserts that the target is not strictly (`===`) equal to the given `val`.
     * @example
     *    cy.wrap(1).should('not.equal', 2)
     * @see http://chaijs.com/api/bdd/#method_equal
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.equal', value: any): Chainable<Subject>
    /**
     * Causes all `.keys` assertions that follow in the chain to not require that the target have all of the given keys. This is the opposite of `.any`, which only requires that the target have at least one of the given keys.
     * @example
     *    cy.wrap({ a: 1, b: 2 }).should('not.have.all.keys', 'c', 'd')
     * @see http://chaijs.com/api/bdd/#method_all
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.all.keys', ...value: string[]): Chainable<Subject>
    /**
     * Causes all `.keys` assertions that follow in the chain to only require that the target not have at least one of the given keys. This is the opposite of `.all`, which requires that the target have all of the given keys.
     * @example
     *    cy.wrap({ a: 1, b: 2 }).should('not.have.any.keys', 'c')
     * @see http://chaijs.com/api/bdd/#method_any
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.any.keys', ...value: string[]): Chainable<Subject>
    /**
     * Asserts that the target does not have a property with the given key `name`. See the `deep-eql` project page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
     * @example
     *    cy.wrap({ x: {a: 1 }}).should('not.have.deep.property', 'y', { a: 1 })
     * @see http://chaijs.com/api/bdd/#method_property
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.deep.property', value: string, obj: object): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length', 2)
     * cy.wrap('foo').should('not.have.length', 2)
     * @alias lengthOf
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not greater than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length.greaterThan', 4)
     *    cy.wrap('foo').should('not.have.length.greaterThan', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length.greaterThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not greater than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length.gt', 4)
     *    cy.wrap('foo').should('not.have.length.gt', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length.gt', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not greater than or equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length.gte', 4)
     *    cy.wrap('foo').should('not.have.length.gte', 4)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.length.gte', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is less than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('have.length.lessThan', 2)
     *    cy.wrap('foo').should('have.length.lessThan', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length.lessThan', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not less than to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length.lt', 2)
     *    cy.wrap('foo').should('not.have.length.lt', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length.lt', value: number): Chainable<Subject>
    /**
     * Asserts that the target’s `length` property is not less than or equal to the given number `n`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.length.let', 2)
     *    cy.wrap('foo').should('not.have.length.lte', 2)
     * @see http://chaijs.com/api/bdd/#method_lengthof
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.length.lte', value: number): Chainable<Subject>
    /**
     * Asserts that the target array does not have the same members as the given array `set`.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.have.members', [4, 5, 6])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.members', values: any[]): Chainable<Subject>
    /**
     * Asserts that the target array does not have the same members as the given array where order matters.
     * @example
     *    cy.wrap([1, 2, 3]).should('not. have.ordered.members', [4, 5, 6])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.ordered.members', values: any[]): Chainable<Subject>
    /**
     * Causes all `.property` and `.include` assertions that follow in the chain to ignore inherited properties.
     * @example
     *    Object.prototype.b = 2
     *    cy.wrap({ a: 1 }).should('have.property', 'a').and('not.have.ownProperty', 'b')
     * @see http://chaijs.com/api/bdd/#method_ownproperty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.ownProperty', property: string): Chainable<Subject>
    /**
     * Asserts that the target has a property with the given key `name`.
     * @example
     *    cy.wrap({ a: 1 }).should('not.have.property', 'b')
     *    cy.wrap({ a: 1 }).should('not.have.property', 'b', 1)
     * @see http://chaijs.com/api/bdd/#method_property
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.property', property: string, value?: any): Chainable<Subject>
    /**
     * Asserts that the target string does not contains the given substring `str`.
     * @example
     *    cy.wrap('foobar').should('not.have.string', 'baz')
     * @see http://chaijs.com/api/bdd/#method_string
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.string', match: string | RegExp): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string `val` is not a substring of the target.
     * @example
     *    cy.wrap('foobar').should('not.include', 'baz')
     * @see http://chaijs.com/api/bdd/#method_include
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.include', value: any): Chainable<Subject>
    /**
     * When the target is a string, `.include` asserts that the given string `val` is not a substring of the target.
     * @example
     *    cy.wrap([1, 2, 3]).should('not.include.members', [4, 5])
     * @see http://chaijs.com/api/bdd/#method_members
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.include.members', value: any[]): Chainable<Subject>
    /**
     * When one argument is provided, `.increase` asserts that the given function `subject` returns a greater number when it’s
     * invoked after invoking the target function compared to when it’s invoked beforehand.
     * `.increase` also causes all `.by` assertions that follow in the chain to assert how much greater of a number is returned.
     * It’s often best to assert that the return value increased by the expected amount, rather than asserting it increased by any amount.
     * @example
     *    let val = 1
     *    function addTwo() { val += 2 }
     *    function getVal() { return val }
     *    cy.wrap(() => {}).should('not.increase', getVal)
     * @see http://chaijs.com/api/bdd/#method_increase
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.increase', value: object, property: string): Chainable<Subject>
    /**
     * Asserts that the target does not match the given regular expression `re`.
     * @example
     *    cy.wrap('foobar').should('not.match', /baz$/)
     * @see http://chaijs.com/api/bdd/#method_match
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.match', value: string | RegExp): Chainable<Subject>
    /**
     * When the target is a non-function object, `.respondTo` asserts that the target does not have a `method` with the given name method. The method can be own or inherited, and it can be enumerable or non-enumerable.
     * @example
     *    class Cat {
     *      meow() {}
     *    }
     *    cy.wrap(new Cat()).should('not.respondTo', 'bark')
     * @see http://chaijs.com/api/bdd/#method_respondto
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.respondTo', value: string): Chainable<Subject>
    /**
     * Invokes the given `matcher` function with the target being passed as the first argument, and asserts that the value returned is falsy.
     * @example
     *    cy.wrap(1).should('not.satisfy', (num) => num < 0)
     * @see http://chaijs.com/api/bdd/#method_satisfy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.satisfy', fn: (val: any) => boolean): Chainable<Subject>
    /**
     * When no arguments are provided, `.throw` invokes the target function and asserts that no error is thrown.
     * When one argument is provided, and it’s a string, `.throw` invokes the target function and asserts that no error is thrown with a message that contains that string.
     * @example
     *    function badFn() { console.log('Illegal salmon!') }
     *    cy.wrap(badFn).should('not.throw')
     *    cy.wrap(badFn).should('not.throw', 'salmon')
     *    cy.wrap(badFn).should('not.throw', /salmon/)
     * @see http://chaijs.com/api/bdd/#method_throw
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'throw', value?: string | RegExp): Chainable<Subject>
    /**
     * When no arguments are provided, `.throw` invokes the target function and asserts that no error is thrown.
     * When one argument is provided, and it’s a string, `.throw` invokes the target function and asserts that no error is thrown with a message that contains that string.
     * @example
     *    function badFn() { console.log('Illegal salmon!') }
     *    cy.wrap(badFn).should('not.throw')
     *    cy.wrap(badFn).should('not.throw', 'salmon')
     *    cy.wrap(badFn).should('not.throw', /salmon/)
     * @see http://chaijs.com/api/bdd/#method_throw
     * @see https://on.cypress.io/assertions
     */
    // tslint:disable-next-line ban-types
    (chainer: 'throw', error: Error | Function, expected?: string | RegExp): Chainable<Subject>

    // sinon-chai
    /**
     * Assert spy/stub was called the `new` operator.
     * Beware that this is inferred based on the value of the this object and the spy function’s prototype, so it may give false positives if you actively return the right kind of object.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithnew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.always.calledWithNew'): Chainable<Subject>
    /**
     * Assert if spy was always called with matching arguments (and possibly others).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwayscalledwithmatcharg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.always.calledWithMatch', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy always returned the provided value.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwaysreturnedobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'always.returned', value: any): Chainable<Subject>
    /**
     * `true` if the spy was called at least once
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.called'): Chainable<Subject>
    /**
     * Assert spy was called after `anotherSpy`
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledafteranotherspy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledAfter', spy: sinon.SinonSpy): Chainable<Subject>
    /**
     * Assert spy was called before `anotherSpy`
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledbeforeanotherspy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledBefore', spy: sinon.SinonSpy): Chainable<Subject>
    /**
     * Assert spy was called at least once with `obj` as `this`. `calledOn` also accepts a matcher (see [matchers](http://sinonjs.org/releases/v4.1.3/spies/#matchers)).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledonobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledOn', context: any): Chainable<Subject>
    /**
     * Assert spy was called exactly once
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledonce
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledOnce'): Chainable<Subject>
    /**
     * Assert spy was called exactly three times
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledthrice
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledThrice'): Chainable<Subject>
    /**
     * Assert spy was called exactly twice
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledtwice
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledTwice'): Chainable<Subject>
    /**
     * Assert spy was called at least once with the provided arguments and no others.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithexactlyarg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledWithExactly', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy was called with matching arguments (and possibly others).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithmatcharg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledWithMatch', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy/stub was called the `new` operator.
     * Beware that this is inferred based on the value of the this object and the spy function’s prototype, so it may give false positives if you actively return the right kind of object.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithnew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.calledWithNew'): Chainable<Subject>
    /**
     * Assert spy always threw an exception.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwaysthrew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.always.thrown', value?: Error | typeof Error | string): Chainable<Subject>
    /**
     * Assert the number of calls.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycallcount
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.callCount', value: number): Chainable<Subject>
    /**
     * Assert spy threw an exception at least once.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spythrew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.thrown', value?: Error | typeof Error | string): Chainable<Subject>
    /**
     * Assert spy returned the provided value at least once. (see [matchers](http://sinonjs.org/releases/v4.1.3/spies/#matchers))
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyreturnedobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'returned', value: any): Chainable<Subject>

    // sinon-chai.not
    /**
     * Assert spy/stub was not called the `new` operator.
     * Beware that this is inferred based on the value of the this object and the spy function’s prototype, so it may give false positives if you actively return the right kind of object.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithnew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.always.calledWithNew'): Chainable<Subject>
    /**
     * Assert if spy was not always called with matching arguments (and possibly others).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwayscalledwithmatcharg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.always.calledWithMatch', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy not always returned the provided value.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwaysreturnedobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.always.returned', value: any): Chainable<Subject>
    /**
     * `true` if the spy was not called at least once
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.called'): Chainable<Subject>
    /**
     * Assert spy was not.called after `anotherSpy`
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledafteranotherspy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledAfter', spy: sinon.SinonSpy): Chainable<Subject>
    /**
     * Assert spy was not called before `anotherSpy`
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledbeforeanotherspy
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledBefore', spy: sinon.SinonSpy): Chainable<Subject>
    /**
     * Assert spy was not called at least once with `obj` as `this`. `calledOn` also accepts a matcher (see [matchers](http://sinonjs.org/releases/v4.1.3/spies/#matchers)).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledonobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledOn', context: any): Chainable<Subject>
    /**
     * Assert spy was not called exactly once
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledonce
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledOnce'): Chainable<Subject>
    /**
     * Assert spy was not called exactly three times
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledthrice
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledThrice'): Chainable<Subject>
    /**
     * Assert spy was not called exactly twice
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledtwice
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledTwice'): Chainable<Subject>
    /**
     * Assert spy was not called at least once with the provided arguments and no others.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithexactlyarg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledWithExactly', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy was not called with matching arguments (and possibly others).
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithmatcharg1-arg2-
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledWithMatch', ...args: any[]): Chainable<Subject>
    /**
     * Assert spy/stub was not called the `new` operator.
     * Beware that this is inferred based on the value of the this object and the spy function’s prototype, so it may give false positives if you actively return the right kind of object.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycalledwithnew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.calledWithNew'): Chainable<Subject>
    /**
     * Assert spy did not always throw an exception.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyalwaysthrew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.always.thrown', value?: Error | typeof Error | string): Chainable<Subject>
    /**
     * Assert not the number of calls.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spycallcount
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.callCount', value: number): Chainable<Subject>
    /**
     * Assert spy did not throw an exception at least once.
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spythrew
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.thrown', value?: Error | typeof Error | string): Chainable<Subject>
    /**
     * Assert spy did not return the provided value at least once. (see [matchers](http://sinonjs.org/releases/v4.1.3/spies/#matchers))
     * @see http://sinonjs.org/releases/v4.1.3/spies/#spyreturnedobj
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.returned', value: any): Chainable<Subject>

    // jquery-chai
    /**
     * Assert that at least one element of the selection is checked, using `.is(':checked')`.
     * @example
     *    cy.get('#result').should('be.checked')
     * @see http://chaijs.com/plugins/chai-jquery/#checked
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.checked'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is disabled, using `.is(':disabled')`.
     * @example
     *    cy.get('#result').should('be.disabled')
     * @see http://chaijs.com/plugins/chai-jquery/#disabled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.disabled'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is empty, using `.is(':empty')`. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('be.empty')
     * @see http://chaijs.com/plugins/chai-jquery/#empty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.empty'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is enabled, using `.is(':enabled')`.
     * @example
     *    cy.get('#result').should('be.enabled')
     * @see http://chaijs.com/plugins/chai-jquery/#enabled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.enabled'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is hidden, using `.is(':hidden')`.
     * @example
     *    cy.get('#result').should('be.hidden')
     * @see http://chaijs.com/plugins/chai-jquery/#hidden
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.hidden'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is selected, using `.is(':selected')`.
     * @example
     *    cy.get('#result').should('be.selected')
     * @see http://chaijs.com/plugins/chai-jquery/#selected
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.selected'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is visible, using `.is(':visible')`.
     * @example
     *    cy.get('#result').should('be.visible')
     * @see http://chaijs.com/plugins/chai-jquery/#visible
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'be.visible'): Chainable<Subject>
    /**
     * Assert that the selection contains the given text, using `:contains()`. If the object asserted against is not a jQuery object, or if `contain` is not called as a function, the original implementation will be called.
     * @example
     *    cy.get('#result').should('contain', 'text')
     * @see http://chaijs.com/plugins/chai-jquery/#containtext
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'contain', value: string): Chainable<Subject>
    /**
     * Assert that the selection is not empty. Note that this overrides the built-in chai assertion. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('exist')
     * @see http://chaijs.com/plugins/chai-jquery/#exist
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'exist'): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given attribute, using `.attr()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('have.attr', 'role')
     *    cy.get('#result').should('have.attr', 'role', 'menu')
     * @see http://chaijs.com/plugins/chai-jquery/#attrname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.attr', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given attribute, using `.attr()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('have.class', 'success')
     * @see http://chaijs.com/plugins/chai-jquery/#classclassname
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.class', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given CSS property, using `.css()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('have.css', 'display', 'none')
     * @see http://chaijs.com/plugins/chai-jquery/#cssname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.css', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given data value, using `.data()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('have.data', 'foo', 'bar')
     * @see http://chaijs.com/plugins/chai-jquery/#dataname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.data', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the selection contains at least one element which has a descendant matching the given selector, using `.has()`.
     * @example
     *    cy.get('#result').should('have.descendants', 'h1')
     * @see http://chaijs.com/plugins/chai-jquery/#descendantsselector
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.descendants', selector: string): Chainable<Subject>
    /**
     * Assert that the html of the first element of the selection is equal to the given html, using `.html()`.
     * @example
     *    cy.get('#result').should('have.html', '<em>John Doe</em>')
     * @see http://chaijs.com/plugins/chai-jquery/#htmlhtml
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.html', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given id, using `.attr('id')`.
     * @example
     *    cy.get('#result').should('have.id', 'result')
     * @see http://chaijs.com/plugins/chai-jquery/#idid
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.id', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given property, using `.prop()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('have.prop', 'disabled')
     *    cy.get('#result').should('have.prop', 'disabled', false)
     * @see http://chaijs.com/plugins/chai-jquery/#propname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.prop', value: string, match?: any): Chainable<Subject>
    /**
     * Assert that the text of the first element of the selection is equal to the given text, using `.text()`.
     * @example
     *    cy.get('#result').should('have.text', 'John Doe')
     * @see http://chaijs.com/plugins/chai-jquery/#texttext
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.text', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection has the given value, using `.val()`.
     * @example
     *    cy.get('textarea').should('have.value', 'foo bar baz')
     * @see http://chaijs.com/plugins/chai-jquery/#valuevalue
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'have.value', value: string): Chainable<Subject>
    /**
     * Assert that the selection matches a given selector, using `.is()`. Note that this overrides the built-in chai assertion. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('match', ':empty')
     * @see http://chaijs.com/plugins/chai-jquery/#matchselector
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'match', value: string): Chainable<Subject>

    // jquery-chai.not
    /**
     * Assert that at least one element of the selection is not checked, using `.is(':checked')`.
     * @example
     *    cy.get('#result').should('not.be.checked')
     * @see http://chaijs.com/plugins/chai-jquery/#checked
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.checked'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not disabled, using `.is(':disabled')`.
     * @example
     *    cy.get('#result').should('not.be.disabled')
     * @see http://chaijs.com/plugins/chai-jquery/#disabled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.disabled'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not empty, using `.is(':empty')`. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('not.be.empty')
     * @see http://chaijs.com/plugins/chai-jquery/#empty
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.empty'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not enabled, using `.is(':enabled')`.
     * @example
     *    cy.get('#result').should('not.be.enabled')
     * @see http://chaijs.com/plugins/chai-jquery/#enabled
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.enabled'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not hidden, using `.is(':hidden')`.
     * @example
     *    cy.get('#result').should('not.be.hidden')
     * @see http://chaijs.com/plugins/chai-jquery/#hidden
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.hidden'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not selected, using `.is(':selected')`.
     * @example
     *    cy.get('#result').should('not.be.selected')
     * @see http://chaijs.com/plugins/chai-jquery/#selected
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.selected'): Chainable<Subject>
    /**
     * Assert that at least one element of the selection is not visible, using `.is(':visible')`.
     * @example
     *    cy.get('#result').should('not.be.visible')
     * @see http://chaijs.com/plugins/chai-jquery/#visible
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.be.visible'): Chainable<Subject>
    /**
     * Assert that the selection does not contain the given text, using `:contains()`. If the object asserted against is not a jQuery object, or if `contain` is not called as a function, the original implementation will be called.
     * @example
     *    cy.get('#result').should('not.contain', 'text')
     * @see http://chaijs.com/plugins/chai-jquery/#containtext
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.contain', value: string): Chainable<Subject>
    /**
     * Assert that the selection is empty. Note that this overrides the built-in chai assertion. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('not.exist')
     * @see http://chaijs.com/plugins/chai-jquery/#exist
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.exist'): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given attribute, using `.attr()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('not.have.attr', 'role')
     *    cy.get('#result').should('not.have.attr', 'role', 'menu')
     * @see http://chaijs.com/plugins/chai-jquery/#attrname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.attr', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given attribute, using `.attr()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('not.have.class', 'success')
     * @see http://chaijs.com/plugins/chai-jquery/#classclassname
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.class', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given CSS property, using `.css()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('not.have.css', 'display', 'none')
     * @see http://chaijs.com/plugins/chai-jquery/#cssname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.css', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given data value, using `.data()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('not.have.data', 'foo', 'bar')
     * @see http://chaijs.com/plugins/chai-jquery/#dataname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.data', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the selection does not contain at least one element which has a descendant matching the given selector, using `.has()`.
     * @example
     *    cy.get('#result').should('not.have.descendants', 'h1')
     * @see http://chaijs.com/plugins/chai-jquery/#descendantsselector
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.descendants', selector: string): Chainable<Subject>
    /**
     * Assert that the html of the first element of the selection is not equal to the given html, using `.html()`.
     * @example
     *    cy.get('#result').should('not.have.html', '<em>John Doe</em>')
     * @see http://chaijs.com/plugins/chai-jquery/#htmlhtml
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.html', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given id, using `.attr('id')`.
     * @example
     *    cy.get('#result').should('not.have.id', 'result')
     * @see http://chaijs.com/plugins/chai-jquery/#idid
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.id', value: string, match?: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given property, using `.prop()`. Optionally, assert a particular value as well. The return value is available for chaining.
     * @example
     *    cy.get('#result').should('not.have.prop', 'disabled')
     *    cy.get('#result').should('not.have.prop', 'disabled', false)
     * @see http://chaijs.com/plugins/chai-jquery/#propname-value
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.prop', value: string, match?: any): Chainable<Subject>
    /**
     * Assert that the text of the first element of the selection is not equal to the given text, using `.text()`.
     * @example
     *    cy.get('#result').should('not.have.text', 'John Doe')
     * @see http://chaijs.com/plugins/chai-jquery/#texttext
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.text', value: string): Chainable<Subject>
    /**
     * Assert that the first element of the selection does not have the given value, using `.val()`.
     * @example
     *    cy.get('textarea').should('not.have.value', 'foo bar baz')
     * @see http://chaijs.com/plugins/chai-jquery/#valuevalue
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.have.value', value: string): Chainable<Subject>
    /**
     * Assert that the selection does not match a given selector, using `.is()`. Note that this overrides the built-in chai assertion. If the object asserted against is not a jQuery object, the original implementation will be called.
     * @example
     *    cy.get('#result').should('not.match', ':empty')
     * @see http://chaijs.com/plugins/chai-jquery/#matchselector
     * @see https://on.cypress.io/assertions
     */
    (chainer: 'not.match', value: string): Chainable<Subject>

    // fallback
    /**
     * Create an assertion. Assertions are automatically retried until they pass or time out.
     * Ctrl+Space will invoke auto-complete in most editors.
     * @see https://on.cypress.io/should
     */
    (chainers: string, value?: any): Chainable<Subject>
    (chainers: string, value: any, match: any): Chainable<Subject>
    /**
     * Create an assertion. Assertions are automatically retried until they pass or time out.
     * Passing a function to `.should()` enables you to make multiple assertions on the yielded subject. This also gives you the opportunity to massage what you’d like to assert on.
     * Just be sure _not_ to include any code that has side effects in your callback function. The callback function will be retried over and over again until no assertions within it throw.
     * @example
     *    cy
     *      .get('p')
     *      .should(($p) => {
     *        // should have found 3 elements
     *        expect($p).to.have.length(3)
     *
     *        // make sure the first contains some text content
     *        expect($p.first()).to.contain('Hello World')
     *
     *        // use jquery's map to grab all of their classes
     *        // jquery's map returns a new jquery object
     *        const classes = $p.map((i, el) => {
     *          return Cypress.$(el).attr('class')
     *        })
     *
     *        // call classes.get() to make this a plain array
     *        expect(classes.get()).to.deep.eq([
     *          'text-primary',
     *          'text-danger',
     *          'text-default'
     *        ])
     *      })
     * @see https://on.cypress.io/should
     */
    (fn: (currentSubject: Subject) => void): Chainable<Subject>
  }

  /**
   * These events come from the application currently under test (your application). These are the most useful events for you to listen to.
   * @see https://on.cypress.io/catalog-of-events#App-Events
   */
  interface Actions {
    /**
     * Fires when an uncaught exception occurs in your application.
     * Cypress will fail the test when this fires.
     * Return `false` from this event and Cypress will not fail the test. Also useful for debugging purposes because the actual `error` instance is provided to you.
     * @example
     * // likely want to do this in a support file
     * // so it's applied to all spec files
     * // cypress/support/index.js
     *
     * Cypress.on('uncaught:exception', (err, runnable) => {
     *   // returning false here prevents Cypress from
     *   // failing the test
     *   return false
     * })
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'uncaught:exception', fn: (error: Error, runnable: Mocha.IRunnable) => false | void): void
    /**
     * Fires when your app calls the global `window.confirm()` method.
     * Cypress will auto accept confirmations. Return `false` from this event and the confirmation will be cancelled.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:confirm', fn: (text: string) => false | void): void
    /**
     * Fires when your app calls the global `window.alert()` method. Cypress will auto accept alerts. You cannot change this behavior.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:alert', fn: (text: string) => void): void
    /**
     * Fires as the page begins to load, but before any of your applications JavaScript has executed. This fires at the exact same time as `cy.visit()` `onBeforeLoad` callback. Useful to modify the window on a page transition.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:before:load', fn: (win: Window) => void): void
    /**
     * Fires after all your resources have finished loading after a page transition. This fires at the exact same time as a `cy.visit()` `onLoad` callback.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:load', fn: (win: Window) => void): void
    /**
     * Fires when your application is about to navigate away. The real event object is provided to you. Your app may have set a `returnValue` on the event, which is useful to assert on.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:before:unload', fn: (event: BeforeUnloadEvent) => void): void
    /**
     * Fires when your application is has unloaded and is navigating away. The real event object is provided to you. This event is not cancelable.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'window:unload', fn: (event: Event) => void): void
    /**
     * Fires whenever Cypress detects that your application's URL has changed.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'url:changed', fn: (url: string) => void): void
    /**
     * Fires when the test has failed. It is technically possible to prevent the test from actually failing by binding to this event and invoking an async `done` callback. However this is **strongly discouraged**. Tests should never legitimately fail. This event exists because it's extremely useful for debugging purposes.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'fail', fn: (error: Error, mocha: Mocha.IRunnable) => void): void
    /**
     * Fires whenever the viewport changes via a `cy.viewport()` or naturally when Cypress resets the viewport to the default between tests. Useful for debugging purposes.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'viewport:changed', fn: (viewport: Viewport) => void): void
    /**
     * Fires whenever **Cypress** is scrolling your application. This event is fired when Cypress is {% url 'waiting for and calculating actionability' interacting-with-elements %}. It will scroll to 'uncover' elements currently being covered. This event is extremely useful to debug why Cypress may think an element is not interactive.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'scrolled', fn: ($el: JQuery) => void): void
    /**
     * Fires when a cy command is first invoked and enqueued to be run later. Useful for debugging purposes if you're confused about the order in which commands will execute.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'command:enqueued', fn: (command: EnqueuedCommand) => void): void
    /**
     * Fires when cy begins actually running and executing your command. Useful for debugging and understanding how the command queue is async.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'command:start', fn: (command: CommandQueue) => void): void
    /**
     * Fires when cy finishes running and executing your command. Useful for debugging and understanding how commands are handled.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'command:end', fn: (command: CommandQueue) => void): void
    /**
     * Fires whenever a command begins its retrying routines. This is called on the trailing edge after Cypress has internally waited for the retry interval. Useful to understand **why** a command is retrying, and generally includes the actual error causing the retry to happen. When commands fail the final error is the one that actually bubbles up to fail the test. This event is essentially to debug why Cypress is failing.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'command:retry', fn: (command: CommandQueue) => void): void
    /**
     * Fires whenever a command emits this event so it can be displayed in the Command Log. Useful to see how internal cypress commands utilize the {% url 'Cypress.log()' cypress-log %} API.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'log:added', fn: (log: any, interactive: boolean) => void): void
    /**
     * Fires whenever a command's attributes changes. This event is debounced to prevent it from firing too quickly and too often. Useful to see how internal cypress commands utilize the {% url 'Cypress.log()' cypress-log %} API.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'log:changed', fn: (log: any, interactive: boolean) => void): void
    /**
     * Fires before the test and all **before** and **beforeEach** hooks run.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'test:before:run', fn: (attributes: ObjectLike, test: Mocha.ITest) => void): void
    /**
     * Fires after the test and all **afterEach** and **after** hooks run.
     * @see https://on.cypress.io/catalog-of-events#App-Events
     */
    (action: 'test:after:run', fn: (attributes: ObjectLike, test: Mocha.ITest) => void): void
  }

  // $CommandQueue from `command_queue.coffee` - a lot to type. Might be more useful if it was written in TS
  interface CommandQueue extends ObjectLike {
    logs(filters: any): any
    add(obj: any): any
    get(): any
    toJSON(): string[]
    create(): CommandQueue
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

  interface EnqueuedCommand {
    name: string
    args: any[]
    type: string
    chainerId: string
    fn(...args: any[]): any
  }

  interface Exec {
    code: number
    stdout: string
    stderr: string
  }

  interface LogAttrs {
    url: string
    consoleProps: ObjectLike
  }

  interface Log {
    end(): Log
    finish(): void
    get<K extends keyof LogConfig>(attr: K): LogConfig[K]
    get(): LogConfig
    set<K extends keyof LogConfig>(key: K, value: LogConfig[K]): Log
    set(options: Partial<LogConfig>): Log
    snapshot(name?: string, options?: { at?: number, next: string }): Log
  }

  interface LogConfig {
    /** The JQuery element for the command. This will highlight the command in the main window when debugging */
    $el: JQuery
    /** Allows the name of the command to be overwritten */
    name: string
    /** Override *name* for display purposes only */
    displayName: string
    message: any[]
    /** Return an object that will be printed in the dev tools console */
    consoleProps(): ObjectLike
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

  interface Viewport {
    viewportWidth: number
    viewportHeight: number
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
  interface Offset {
    top: number,
    left: number
  }

  // Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
  type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T]
  // @ts-ignore TODO - remove this if possible. Seems a recent change to TypeScript broke this. Possibly https://github.com/Microsoft/TypeScript/pull/17912
  type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>
}

/**
 * Global variables `cy` added by Cypress with all API commands.
 * @see https://on.cypress.io/api
 * @example
 *    cy.get('button').click()
 *    cy.get('.result').contains('Expected text')
 */
declare const cy: Cypress.Chainable<undefined>
/**
 * Global variable `Cypress` holds common utilities and constants.
 * @see https://on.cypress.io/api
 * @example
 *    Cypress.config("pageLoadTimeout") // => 60000
 *    Cypress.version // => "1.4.0"
 *    Cypress._ // => Lodash _
 */
declare const Cypress: Cypress.Cypress
