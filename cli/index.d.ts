// Type definitions for Cypress test runner
// Project: https://www.cypress.io
// GitHub:  https://github.com/cypress-io/cypress
// Definitions by: Gert Hengeveld <https://github.com/ghengeveld>
//                 Mike Woudenberg <https://github.com/mikewoudenberg>
//                 Robbert van Markus <https://github.com/rvanmarkus>
// TypeScript Version: 2.x
// Updated by the Cypress team: https://www.cypress.io/about/

declare namespace Cypress {
  type FileContents = string | any[] | object;
  type HistoryDirection = "back" | "forward";
  type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT";
  type RequestBody = string | object;
  type ViewportOrientation = "portrait" | "landscape";

  interface Core {
    /**
     * @see https://on.cypress.io/api/config
     */
    config(): object;
    config(key: string): any;
    config(key: string, value: any): void;
    config(Object: object): void;

    /**
     * @see https://on.cypress.io/api/env
     */
    env(): object;
    env(key: string): any;
    env(key: string, value: any): void;
    env(Object: object): void;

    /**
     * @see https://on.cypress.io/api/commands
     */
    addChildCommand(name: string, fn: (...args: any[]) => void): void;
    addDualCommand(name: string, fn: (...args: any[]) => void): void;
    addParentCommand(name: string, fn: (...args: any[]) => void): void;

    _: any;
    $: any;
    minimatch: any;
    moment: any;
    Blob: any;
    Promise: any;
    Log: any;

    /**
     * @see https://on.cypress.io/api/cookies
     */
    Cookies: {
      debug(enabled: boolean, options?: DebugOptions): void;
      preserveOnce(...names: string[]): void;
      defaults(options: CookieDefaults): void;
    };

    /**
     * @see https://on.cypress.io/api/dom
     */
    Dom: {
      isHidden(element: object): boolean;
    };

    /**
     * @see https://on.cypress.io/api/api-server
     */
    Server: {
      defaults(options: ServerOptions): void;
    };
  }

  interface Chainable {
    /**
     * @see https://on.cypress.io/api/and
     */
    and(chainers: string, value?: any): Chainable;
    and(chainers: string, method: string, value: any): Chainable;
    and(fn: (currentSubject?: any) => void): Chainable;

    /**
     * @see https://on.cypress.io/api/as
     */
    as(alias: string): Chainable;

    /**
     * @see https://on.cypress.io/api/blur
     */
    blur(options?: BlurOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/check
     */
    check(options?: CheckOptions): Chainable;
    check(value: string | string[]): Chainable; // no options

    /**
     * @see https://on.cypress.io/api/children
     */
    children(options?: LoggableTimeoutable): Chainable;
    children(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/clear
     */
    clear(options?: ClearOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/clearcookie
     */
    clearCookie(name: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/clearcookies
     */
    clearCookies(options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/clearlocalstorage
     */
    clearLocalStorage(key?: string): Chainable;
    clearLocalStorage(re: RegExp): Chainable;

    /**
     * @see https://on.cypress.io/api/click
     */
    click(options?: ClickOptions): Chainable;
    click(position: string, options?: ClickOptions): Chainable;
    click(x: number, y: number, options?: ClickOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/closest
     */
    closest(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/contains
     */
    contains(text: string, options?: LoggableTimeoutable): Chainable;
    contains(num: number | RegExp): Chainable;
    contains(selector: string, text: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/dblclick
     */
    dblclick(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/debug
     */
    debug(options?: Loggable): Chainable;

    /**
     * Get the window.document of the page that is currently active.
     *
     * @param {Loggable} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/api/document
     * @example
     *    cy.document()
     *      .its('contentType')
     *      .should('eq', 'text/html')
     */
    document(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/each
     */
    each(fn: (element?: any, index?: number, $list?: any) => void): Chainable;

    /**
     * @see https://on.cypress.io/api/end
     */
    end(): Chainable;

    /**
     * @see https://on.cypress.io/api/eq
     */
    eq(index: number, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/exec
     */
    exec(command: string, options?: ExecOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/filter
     */
    filter(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/find
     */
    find(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/first
     */
    first(options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/fixture
     */
    fixture(path: string, options?: Timeoutable): Chainable; // no log?
    fixture(path: string, encoding: string, options?: Timeoutable): Chainable; // no log?

    /**
     * Get the DOM element that is currently focused.
     *
     * @param {Loggable} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/api/focus
     */
    focus(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/focused
     */
    focused(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/get
     */
    get(selector: string, options?: LoggableTimeoutable): Chainable;
    get(alias: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/getcookie
     */
    getCookie(name: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/getcookies
     */
    getCookies(options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/go
     */
    go(direction: HistoryDirection | number, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/hash
     */
    hash(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/invoke
     */
    invoke(functionName: string, ...args: any[]): Chainable;

    /**
     * @see https://on.cypress.io/api/its
     */
    its(propertyName: string): Chainable;

    /**
     * @see https://on.cypress.io/api/last
     */
    last(options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/location
     */
    location(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/log
     */
    log(message: string, args: any): Chainable;

    /**
     * @see https://on.cypress.io/api/next
     */
    next(options?: LoggableTimeoutable): Chainable;
    next(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/not
     */
    not(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/parent
     */
    parent(options?: LoggableTimeoutable): Chainable;
    parent(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/parents
     */
    parents(options?: LoggableTimeoutable): Chainable;
    parents(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/pause
     */
    pause(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/prev
     */
    prev(options?: LoggableTimeoutable): Chainable;
    prev(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/readfile
     */
    readFile(filePath: string, options?: Timeoutable): Chainable; // no log?
    readFile(filePath: string, encoding: string, options?: Timeoutable): Chainable; // no log?

    /**
     * @see https://on.cypress.io/api/reload
     */
    reload(options?: LoggableTimeoutable): Chainable;
    reload(forceReload: boolean): Chainable; // no options?

    /**
     * @see https://on.cypress.io/api/request
     */
    request(url: string, body?: RequestBody): Chainable;
    request(method: HttpMethod, url: string, body?: RequestBody): Chainable;
    request(options: RequestOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/root
     */
    root(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/route
     */
    route(url: string, response?: any): Chainable;
    route(method: string, url: string, response?: any): Chainable;
    route(fn: () => RouteOptions | RouteOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/screenshot
     */
    screenshot(options?: LoggableTimeoutable): Chainable;
    screenshot(fileName: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/select
     */
    select(text: string | string[], options?: SelectOptions): Chainable;
    select(value: string | string[], options?: SelectOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/server
     */
    server(options?: ServerOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/setcookie
     */
    setCookie(name: string, value: string, options?: SetCookieOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/should
     */
    should(chainers: string, value?: any): Chainable;
    should(chainers: string, method: string, value: any): Chainable;
    should(fn: (currentSubject?: any) => void): Chainable;

    /**
     * @see https://on.cypress.io/api/siblings
     */
    siblings(options?: LoggableTimeoutable): Chainable;
    siblings(selector: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/spread
     */
    spread(fn: (...args: any[]) => any): Chainable;

    /**
     * @see https://on.cypress.io/api/submit
     */
    submit(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/then
     */
    then(fn: (currentSubject: any) => any, options?: Timeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/title
     */
    title(options?: Loggable): Chainable;

    /**
     * @description Trigger an event on a DOM element.
     * @see https://docs.cypress.io/api/commands/trigger.html
     */
    trigger(eventName: string, position?: PositionType, x?: number, y?: number, options?: TriggerOptions): Chainable;

    /**
     * Type into a DOM element.
     *
     * @param {string} text The text to be typed into the DOM element.
     * @param {TypeOptions} [options]
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/api/type
     * @example
     *
     *    cy.get('input').type('Hello, World')
     *    // Type 'Hello, World' into the 'input'
     */
    type(text: string, options?: TypeOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/uncheck
     */
    uncheck(options?: CheckOptions): Chainable;
    uncheck(values: string[]): Chainable; // no options? missing single value variant

    /**
     * @see https://on.cypress.io/api/url
     */
    url(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/viewport
     */
    viewport(width: number, height: number, options?: Loggable): Chainable;
    viewport(preset: string, orientation: ViewportOrientation, options?: Loggable): Chainable;

    /**
     * Visit the given url
     *
     * @param {string} url The URL to visit. If relative uses `baseUrl`
     * @param {VisitOptions} [options] Pass in an options object to change the default behavior of `cy.visit()`
     * @returns {Chainable}
     * @memberof Chainable
     * @see https://on.cypress.io/api/visit
     * @example
     *    cy.visit('http://localhost:3000')
     */
    visit(url: string, options?: VisitOptions): Chainable;

    /**
     * @see https://on.cypress.io/api/wait
     */
    wait(ms: number | string[]): Chainable; // no options?
    wait(alias: string, options?: LoggableTimeoutable): Chainable;

    /**
     * @see https://on.cypress.io/api/window
     */
    window(options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/within
     */
    within(fn: (currentSubject?: any) => void): Chainable;
    within(options: Loggable, fn: (currentSubject?: any) => void): Chainable; // inconsistent argument order

    /**
     * @see https://on.cypress.io/api/wrap
     */
    wrap(Object: object, options?: Loggable): Chainable;

    /**
     * @see https://on.cypress.io/api/writefile
     */
    writeFile(filePath: string, contents: FileContents, options?: Timeoutable): Chainable;
    writeFile(filePath: string, contents: FileContents, encoding: string, options?: Timeoutable): Chainable;
  }

  interface DebugOptions {
    verbose?: boolean;
  }

  interface CookieDefaults {
    whitelist?: string | string[] | RegExp | ((cookie: any) => boolean);
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
    log?: boolean;
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
    timeout?: number;
  }

  interface LoggableTimeoutable extends Loggable, Timeoutable { }

  interface BlurOptions extends Loggable {
    force?: boolean;
  }

  interface CheckOptions extends Loggable, Timeoutable {
    interval?: number;
    force?: boolean;
  }

  interface ClearOptions extends Loggable, Timeoutable {
    force?: boolean;
    interval?: number;
  }

  interface ClickOptions extends Loggable, Timeoutable {
    force?: boolean;
    multiple?: boolean;
    interval?: number;
  }

  interface ExecOptions extends Loggable, Timeoutable {
    failOnNonZeroExit?: boolean;
    env?: object;
  }

  interface RequestOptions extends Loggable, Timeoutable {
    auth?: object;
    body?: RequestBody;
    failOnStatusCode?: boolean;
    followRedirect?: boolean;
    form?: boolean;
    gzip?: boolean;
    headers?: object;
    method?: HttpMethod;
    qs?: string;
    url: string;
  }

  interface RouteOptions {
    method?: HttpMethod;
    url?: string | RegExp;
    response?: any;
    status?: number;
    delay?: number;
    headers?: object;
    force404?: boolean;
    onRequest?(...args: any[]): void;
    onResponse?(...args: any[]): void;
    onAbort?(...args: any[]): void;
  }

  interface SelectOptions extends Loggable, Timeoutable {
    force?: boolean;
    interval?: number;
  }

  interface ServerOptions {
    delay?: number;
    method?: HttpMethod;
    status?: number;
    headers?: object;
    response?: any;
    onRequest?(...args: any[]): void;
    onResponse?(...args: any[]): void;
    onAbort?(...args: any[]): void;
    enable?: boolean;
    force404?: boolean;
    urlMatchingOptions?: object;
    whitelist?(...args: any[]): void;
  }

  interface SetCookieOptions extends Loggable, Timeoutable {
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expiry?: number;
  }

  /**
   * Options that control `cy.type` command
   *
   * @interface TypeOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   * @see https://on.cypress.io/api/type
   */
  interface TypeOptions extends Loggable, Timeoutable {
    /**
     * Delay after each keypress (ms)
     *
     * @type {number}
     * @default 10
     * @memberof TypeOptions
     */
    delay?: number;
    /**
     * Forces the action, disables waiting for actionability
     *
     * @type {boolean}
     * @default false
     * @memberof TypeOptions
     */
    force?: boolean;
    /**
     * Keep a modifier activated between commands
     *
     * @type {boolean}
     * @default true
     * @memberof TypeOptions
     */
    release?: boolean;
  }

  /**
   * Visit website options
   *
   * @interface VisitOptions
   * @extends {Loggable}
   * @extends {Timeoutable}
   */
  interface VisitOptions extends Loggable, Timeoutable {
    /**
     * Called before your page has loaded all of its resources.
     *
     * @param {Window} contentWindow the remote page's window object
     * @memberof VisitOptions
     */
    onBeforeLoad?(window: Window): void;
    /**
     * Called once your page has fired its load event.
     *
     * @param {Window} contentWindow the remote page's window object
     * @memberof VisitOptions
     */
    onLoad?(window: Window): void;
  }

  interface TriggerOptions {
    log?: boolean;
    force?: boolean;
    bubbles?: boolean;
    cancable?: boolean;
    timeout?: number;
  }

  type PositionType = "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight";
}

declare const cy: Cypress.Chainable;
