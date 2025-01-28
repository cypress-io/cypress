import '@testing-library/cypress/add-commands'
import { knownBrowsers } from '@packages/launcher/lib/known-browsers'
import { configure } from '@testing-library/cypress'
import { fixtureDirs, ProjectFixtureDir } from '@tooling/system-tests'
import type { DataContext } from '@packages/data-context'
import type { AuthenticatedUserShape } from '@packages/data-context/src/data'
import type { DocumentNode, ExecutionResult } from 'graphql'
import { GET_MAJOR_VERSION_FOR_CONTENT, type Browser, type FoundBrowser, type OpenModeOptions } from '@packages/types'

import type { SinonStub } from 'sinon'
import type sinon from 'sinon'
import type pDefer from 'p-defer'
import 'cypress-plugin-tab'
import type { Response } from 'cross-fetch'

import type { E2ETaskMap } from '../e2e/e2ePluginSetup'
import { installCustomPercyCommand } from './customPercyCommand'
import i18n from '../../src/locales/en-US.json'
import { addNetworkCommands } from './onlineNetwork'
import { logInternal } from './utils'
import { tabUntil } from './tab-until'
import './browserIconCommands'

configure({ testIdAttribute: 'data-cy' })

const NO_TIMEOUT = 1000 * 1000
const TEN_SECONDS = 10 * 1000
const SIXTY_SECONDS = 60 * 1000

export interface WithCtxOptions extends Cypress.Loggable, Cypress.Timeoutable {
  retry?: boolean
  retryDelay?: number // default 1000
  retryCount?: number // default 5
  projectName?: ProjectFixtureDir
  [key: string]: any
}

export interface WithCtxInjected extends WithCtxOptions {
  require: typeof require
  process: typeof process
  sinon: typeof sinon
  pDefer: typeof pDefer
  testState: Record<string, any>
  projectDir(projectName: ProjectFixtureDir): string
}

export interface RemoteGraphQLInterceptPayload {
  operationName?: string
  query: string
  variables: Record<string, any>
  document: DocumentNode
  result: ExecutionResult
  callCount: number
  Response: typeof Response
}

export interface RemoteGraphQLBatchInterceptPayload<T> {
  key: string
  index: number
  field: string
  variables: Record<string, any>
  result: T
}

export type RemoteGraphQLInterceptor <T = {[key: string]: any}> = (
  obj: RemoteGraphQLInterceptPayload, testState: Record<string, any>, options: Record<string, any>) => ExecutionResult<T> | Promise<ExecutionResult<T>> | Response

export type RemoteGraphQLBatchInterceptor<T = any> = (obj: RemoteGraphQLBatchInterceptPayload<T>, testState: Record<string, any>) => T | Promise<T>

export interface FindBrowsersOptions {
  // Array of FoundBrowser objects that will be used as the mock output
  browsers?: FoundBrowser[]
  /**
   * Function used to filter the standard set of mocked browsers. Ignored if browsers option is provided.
   * Ex.
   * cy.findBrowsers({
   *   filter: (browser) => browser.name === 'chrome' // Sets Chrome, Chrome Beta, Canary
   * })
   */
  filter?(browser: Browser): boolean
}

export interface ValidateExternalLinkOptions {
  /**
   * The user-visible descriptor for the link. If omitted, the href
   * is assumed to be the name.
   */
  name?: string
  /**
   * The href value of the link to be validated.
   */
  href: string
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * The i18n strings, provided for convenience when testing string values in e2e tests
       */
      i18n: typeof i18n
      /**
       * Calls a function block with the "ctx" object from the server,
       * and an object containing any options passed into the server context
       * and some helper properties:
       *
       * You cannot access any variables outside of the function scope,
       * however we do provide expect, chai, sinon
       */
      withCtx: typeof withCtx
      /**
       * Retries the withCtx call with a delay, useful if we're asserting on
       * something that might occur as part of an async operation
       */
      withRetryableCtx: typeof withRetryableCtx
      /**
       * Scaffolds a project for use in tests
       */
      scaffoldProject: typeof scaffoldProject
      /**
       * Takes the name of a "system" test directory, and mounts the project
       * within open mode. Assumes the project has already been scaffolded with `scaffoldProject`
       */
      openProject: typeof openProject
      /**
       * Adds a project
       */
      addProject: typeof addProject
      /**
       * //
       */
      openGlobalMode: typeof openGlobalMode
      /**
       * Starts the "App Server", not needed for launchpad tests,
       * but needed if we are testing the application
       */
      startAppServer: typeof startAppServer
      /**
       * Simulates a user logged-in to the cypress app
       */
      loginUser: typeof loginUser
      /**
       * Simulates a user logged-out from the cypress app
       */
      // logoutUser: typeof logoutUser
      /**
       * Gives the ability to intercept the remote GraphQL request & respond accordingly
       */
      remoteGraphQLIntercept: typeof remoteGraphQLIntercept
      /**
       * Gives the ability to intercept the batched remote GraphQL request & respond accordingly
       */
      remoteGraphQLInterceptBatched: typeof remoteGraphQLInterceptBatched
      /**
       * Removes the sinon spy'ing on the remote GraphQL fake requests
       */
      disableRemoteGraphQLFakes(): void
      /**
       * Visits the Cypress app, for Cypress-in-Cypress testing
       */
      visitApp(href?: string, opts?: Partial<Cypress.VisitOptions>): Chainable<AUTWindow>
      /**
       * Verifies the specs page is visible (list, no specs, or create spec page)
       */
      specsPageIsVisible(specsSetup?: 'new-project' | 'no-specs'): Chainable<any>
      /**
       * Visits the Cypress launchpad
       */
      visitLaunchpad: typeof visitLaunchpad
      /**
       * Skips the welcome screen of the launchpad
       */
      skipWelcome(): Chainable<any>
      /**
       * Mocks the system browser retrieval to return the desired browsers
       */
      findBrowsers(options?: FindBrowsersOptions): void
      /**
       * Finds a link with the provided text and href, either globally or within a chained subject,
       * and asserts that it triggers the appropriate mutation when clicked.
       */
      validateExternalLink(options: ValidateExternalLinkOptions | string): Chainable<JQuery<HTMLElement>>
      /**
       * Get the AUT <iframe>. Useful for Cypress in Cypress tests.
       */
      getAutIframe(): Chainable<JQuery<HTMLIFrameElement>>
    }

  }
}

cy.i18n = i18n

before(() => {
  Cypress.env('e2e_launchpadPort', undefined)
  taskInternal('__internal__before', undefined).then(({ launchpadPort }) => {
    Cypress.env('e2e_launchpadPort', launchpadPort)
  })
})

beforeEach(() => {
  // Reset the ports so we know we need to call "openProject" before each test
  Cypress.env('e2e_serverPort', undefined)
  taskInternal('__internal__beforeEach', undefined)
})

after(() => {
  taskInternal('__internal__after', undefined)
})

function scaffoldProject (projectName: ProjectFixtureDir, options: { timeout?: number } = { timeout: SIXTY_SECONDS }) {
  return logInternal({ name: 'scaffoldProject', message: projectName }, () => {
    return taskInternal('__internal_scaffoldProject', projectName, options)
  })
}

function addProject (projectName: ProjectFixtureDir, open = false) {
  return logInternal({ name: 'addProject', message: projectName }, () => {
    return taskInternal('__internal_addProject', { projectName, open })
  })
}

export interface ResetOptionsResult {
  modeOptions: OpenModeOptions
  e2eServerPort?: number | null
}

export interface OpenGlobalModeOptions {
  argv?: string[]
  byFlag?: boolean
}

function openGlobalMode (options: OpenGlobalModeOptions = {}) {
  return logInternal({ name: 'openGlobalMode', message: '' }, () => {
    return taskInternal('__internal_openGlobal', options)
  }).then((obj) => {
    Cypress.env('e2e_serverPort', obj.e2eServerPort)

    return obj.modeOptions
  })
}

type WithPrefix<T extends string> = `${T}${string}`;

function openProject (projectName: WithPrefix<ProjectFixtureDir>, argv: string[] = []) {
  if (!fixtureDirs.some((dir) => projectName.startsWith(dir))) {
    throw new Error(`Unknown project ${projectName}`)
  }

  return logInternal({ name: 'openProject', message: argv.join(' ') }, () => {
    return taskInternal('__internal_openProject', { projectName, argv })
  }).then((obj) => {
    Cypress.env('e2e_serverPort', obj.e2eServerPort)

    return obj.modeOptions
  })
}

function startAppServer (mode: 'component' | 'e2e' = 'e2e', options: { skipMockingPrompts: boolean } = { skipMockingPrompts: false }) {
  const { name, family } = Cypress.browser

  if (family !== 'chromium' || name === 'electron') {
    throw new Error(`Cypress in cypress does not support running in the ${name} browser`)
  }

  return logInternal('startAppServer', (log) => {
    return cy.window({ log: false }).then((win) => {
      return cy.withCtx(async (ctx, o) => {
        await ctx.lifecycleManager.waitForInitializeSuccess()
        ctx.actions.project.setAndLoadCurrentTestingType(o.mode)
        const isInitialized = o.pDefer()
        const initializeActive = ctx.actions.project.initializeActiveProject
        const onErrorStub = o.sinon.stub(ctx, 'onError')
        const onLoadErrorStub = o.sinon.stub(ctx.lifecycleManager, 'onLoadError')
        const initializeActiveProjectStub = o.sinon.stub(ctx.actions.project, 'initializeActiveProject')

        function restoreStubs () {
          onErrorStub.restore()
          onLoadErrorStub.restore()
          initializeActiveProjectStub.restore()
        }

        // Used to format a Cypress error in a way that makes sense to the cy-in-cy
        // open mode reporter. Typically we'll see all the details we need in the
        // terminal or in the Cypress UI components, but in the reporter we need to format it a bit
        function formatError (e: Error & {messageMarkdown?: string, originalError?: Error}) {
          if (e.messageMarkdown) {
            e.message = e.messageMarkdown
            if (e.originalError) {
              e.message = `${e.message}\n\n${e.originalError.message}`
            }
          }

          return e
        }

        function onStartAppError (e: Error) {
          // Cypress Error
          isInitialized.reject(formatError(e))
          restoreStubs()
        }

        onErrorStub.callsFake(onStartAppError)
        onLoadErrorStub.callsFake(onStartAppError)

        initializeActiveProjectStub.callsFake(async function (this: any, ...args) {
          try {
            const result = await initializeActive.apply(this, args)

            isInitialized.resolve(result)

            return result
          } catch (e) {
            isInitialized.reject(formatError(e))
          } finally {
            restoreStubs()
          }

          return
        })

        await isInitialized.promise

        if (!ctx.lifecycleManager.browsers?.length) throw new Error('No browsers available in startAppServer')

        await ctx.actions.browser.setActiveBrowser(ctx.lifecycleManager.browsers[0])
        // @ts-expect-error this interface is strict about the options it expects
        await ctx.actions.project.launchProject(o.mode, { url: o.url })

        if (!o.skipMockingPrompts
        // avoid re-stubbing already stubbed prompts in case we call startAppServer multiple times
          && (ctx._apis.projectApi.getCurrentProjectSavedState as any).wrappedMethod === undefined) {
          // avoid unwanted prompt
          o.sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
            firstOpened: 1609459200000,
            lastOpened: 1609459200000,
            promptsShown: { ci1: 1609459200000 },
            banners: { _disabled: true },
          })
        }

        return ctx.coreData.servers.appServerPort
      }, { log: false, mode, url: win.top ? win.top.location.href : undefined, ...options }).then((serverPort) => {
        log?.set({ message: `port: ${serverPort}` })
        Cypress.env('e2e_serverPort', serverPort)
      })
    })
  })
}

function visitApp (href?: string, opts?: Partial<Cypress.VisitOptions>) {
  const { e2e_serverPort } = Cypress.env()

  if (!e2e_serverPort) {
    throw new Error(`
      Missing serverPort, app was not initialized.
      Make sure you're adding args to openModeSystemTest which will launch the browser, such as:
      ['--e2e', '--browser', 'electron']
    `)
  }

  return logInternal('visitApp', () => {
    return cy.withCtx(async (ctx) => {
      const config = await ctx.lifecycleManager.getFullInitialConfig()

      return config.clientRoute
    }).then((clientRoute) => {
      return cy.visit(`http://localhost:${e2e_serverPort}${clientRoute || '/__/'}#${href || ''}`, opts)
    })
  })
}

function specsPageIsVisible (specsSetup) {
  if (specsSetup === 'new-project') {
    // if this is a new project, we'll be on the create spec page
    return cy.get('[data-cy=create-spec-page-cards]').should('be.visible')
  }

  if (specsSetup === 'no-specs') {
    // if this is an existing project with no specs, we'll be on the no specs found page
    return cy.get('[data-cy=create-spec-page-description]').should('be.visible')
  }

  // if our tests seeded specs, we'll be on the specs list page
  return cy.get('[data-cy=spec-list-container]').should('be.visible')
}

function visitLaunchpad (options: { showWelcome?: boolean } = { showWelcome: false }) {
  function launchpadVisit () {
    return cy.visit(`/__launchpad/index.html`, { log: false }).then((val) => {
      return cy.get('[data-e2e]', { timeout: 10000, log: false }).then(() => {
        return cy.get('.spinner', { timeout: 10000, log: false }).should('not.exist').then(() => {
          return val
        })
      })
    })
  }

  return logInternal(`visitLaunchpad ${Cypress.env('e2e_launchpadPort')}`, () => {
    if (!options.showWelcome) {
      return cy.withCtx(async (ctx, o) => {
        // avoid re-stubbing already stubbed prompts in case we call getPreferences multiple times
        if ((ctx._apis.localSettingsApi.getPreferences as any).wrappedMethod === undefined) {
          o.sinon.stub(ctx._apis.localSettingsApi, 'getPreferences').resolves({ majorVersionWelcomeDismissed: {
            [o.MAJOR_VERSION_FOR_CONTENT]: Date.now(),
          } })
        }
      }, {
        MAJOR_VERSION_FOR_CONTENT: GET_MAJOR_VERSION_FOR_CONTENT(),
      }).then(() => {
        return launchpadVisit()
      })
    }

    return launchpadVisit()
  })
}

function skipWelcome () {
  // click Continue on Welcome page
  // and wait for the button to disappear
  return cy.contains('[data-cy="major-version-welcome-footer"] button', 'Continue')
  .click()
  .should('not.exist')
}

type UnwrapPromise<R> = R extends PromiseLike<infer U> ? U : R

export type CyTaskResult<R> =
  {value?: never, error: {name: string, message: string, stack?: string}} |
  {value: UnwrapPromise<R>, error?: never}

function withRetryableCtx<T extends Partial<WithCtxOptions>, R> (fn: (ctx: DataContext, o: T & WithCtxInjected) => R | Promise<R>, opts: T = {} as T): Cypress.Chainable<UnwrapPromise<R>> {
  return withCtx(fn, { ...opts, retry: true })
}

function withCtx<T extends Partial<WithCtxOptions>, R> (fn: (ctx: DataContext, o: T & WithCtxInjected) => R | Promise<R>, opts: T = {} as T): Cypress.Chainable<UnwrapPromise<R>> {
  const { log, timeout, ...rest } = opts

  const _log = log === false ? { end () {}, set (key: string, val: any) {} } : Cypress.log({
    name: opts.retry ? 'withRetryableCtx' : 'withCtx',
    message: '(view in console)',
    consoleProps () {
      return {
        'Executed': fn.toString(),
        timeout,
        options: rest,
      }
    },
  })

  return cy.task<CyTaskResult<R>>('__internal_withCtx', {
    fn: fn.toString(),
    options: rest,
  }, { timeout: timeout ?? Cypress.env('e2e_isDebugging') ? NO_TIMEOUT : SIXTY_SECONDS, log: Boolean(Cypress.env('e2e_isDebugging')) }).then((result) => {
    _log?.set('result', result)
    _log?.end()

    if (result.error) {
      const err = new Error(result.error.message)

      err.name = result.error.name
      err.stack = result.error.stack
      throw err
    }

    return result.value as Cypress.Chainable<UnwrapPromise<R>>
  })
}

function loginUser (userShape: Partial<AuthenticatedUserShape> = {}) {
  return logInternal({ name: 'loginUser', message: JSON.stringify(userShape) }, () => {
    return cy.withCtx(async (ctx, o) => {
      ctx.update((d) => {
        d.user = {
          authToken: '1234',
          email: 'test@example.com',
          name: 'Test User',
          ...o.userShape,
        }
      })
    }, { log: false, userShape })
  })
}

function findBrowsers (options: FindBrowsersOptions = {}) {
  let filteredBrowsers = options.browsers

  if (!filteredBrowsers) {
    const reducer = (result: FoundBrowser[], browser: Browser, index: number): FoundBrowser[] => {
      if (!options.filter || options.filter(browser)) {
        const foundBrowser: FoundBrowser = {
          ...browser,
          version: `${index + 1}.${index + 2}.${index + 3}`,
          majorVersion: `${index + 1}`,
          path: `/test/${browser.name}/path`,
        }

        result.push(foundBrowser)
      }

      return result
    }

    filteredBrowsers = [...knownBrowsers, {
      name: 'electron',
      channel: 'stable',
      family: 'chromium',
      displayName: 'Electron',
    } as Browser].reduce(reducer, [])
  }

  logInternal('findBrowsers', () => {
    return cy.withCtx(async (ctx, o) => {
      o.sinon.stub(ctx._apis.browserApi, 'getBrowsers').resolves(o.browsers)
    }, { browsers: filteredBrowsers, log: false })
  })
}

function remoteGraphQLIntercept <T = any> (fn: RemoteGraphQLInterceptor<T>, remoteGraphQLOptions?: Record<string, any>) {
  return logInternal('remoteGraphQLIntercept', () => {
    return taskInternal('__internal_remoteGraphQLIntercept', {
      fn: fn.toString(),
      remoteGraphQLOptions,
    })
  })
}

function remoteGraphQLInterceptBatched <T = any> (fn: RemoteGraphQLBatchInterceptor<T>) {
  return logInternal('remoteGraphQLInterceptBatched', () => {
    return taskInternal('__internal_remoteGraphQLInterceptBatched', fn.toString())
  })
}

type Resolved<V> = V extends Promise<infer U> ? U : V

/**
 * Run an internal task, as defined by e2ePluginSetup. Automatically tracks the types
 *
 */
function taskInternal<T extends keyof E2ETaskMap> (name: T, arg: Parameters<E2ETaskMap[T]>[0], options: { timeout?: number } = {}): Cypress.Chainable<Resolved<ReturnType<E2ETaskMap[T]>>> {
  const isDebugging = Boolean(Cypress.env('e2e_isDebugging'))

  return cy.task<Resolved<ReturnType<E2ETaskMap[T]>>>(name, arg, { log: isDebugging, timeout: options.timeout ?? (isDebugging ? NO_TIMEOUT : TEN_SECONDS) })
}

/**
 * Finds a link with the provided text and href, either globally or within a chained subject,
 * and asserts that it triggers the appropriate mutation when clicked.
 */
function validateExternalLink (subject, options: ValidateExternalLinkOptions | string): Cypress.Chainable<JQuery<HTMLElement>> {
  let name: string | undefined
  let href: string

  if (Cypress._.isString(options)) {
    name = href = options
  } else {
    ({ name, href } = options)
  }

  return logInternal('validateExternalLink', () => {
    cy.wrap(subject, { log: false }).findByRole('link', { name: name || href }).as('Link')
    .should('have.attr', 'href', href)
    .click()

    cy.withRetryableCtx(async (ctx, o) => {
      // The actual openExternal call may include the GQL port, so we only assert that it starts with the requested href
      // rather than equalling it exactly.
      expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg.startsWith(o.href)).to.be.true
    }, { href, log: false })

    return cy.get('@Link')
  })
}

function getAutIframe () {
  return cy.get('iframe.aut-iframe').its('0.contentDocument.documentElement').then(cy.wrap) as Cypress.Chainable<JQuery<HTMLIFrameElement>>
}

Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop completed with undelivered notifications.'))

Cypress.Commands.add('scaffoldProject', scaffoldProject)

Cypress.Commands.add('getAutIframe', getAutIframe)
Cypress.Commands.add('addProject', addProject)
Cypress.Commands.add('openGlobalMode', openGlobalMode)
Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('specsPageIsVisible', specsPageIsVisible)
Cypress.Commands.add('loginUser', loginUser)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('skipWelcome', skipWelcome)
Cypress.Commands.add('startAppServer', startAppServer)
Cypress.Commands.add('openProject', openProject)
Cypress.Commands.add('withCtx', withCtx)
Cypress.Commands.add('withRetryableCtx', withRetryableCtx)
Cypress.Commands.add('remoteGraphQLIntercept', remoteGraphQLIntercept)
Cypress.Commands.add('remoteGraphQLInterceptBatched', remoteGraphQLInterceptBatched)
Cypress.Commands.add('findBrowsers', findBrowsers)
Cypress.Commands.add('tabUntil', tabUntil)
Cypress.Commands.add('validateExternalLink', { prevSubject: ['optional', 'element'] }, validateExternalLink)

installCustomPercyCommand({
  elementOverrides: {
    '.runnable-header .duration': ($el) => {
      $el.text('XX:XX')
    },
  },
})

addNetworkCommands()
