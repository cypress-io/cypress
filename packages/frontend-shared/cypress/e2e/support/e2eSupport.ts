import '@testing-library/cypress/add-commands'
import i18n from '../../../src/locales/en-US.json'
import type { DataContext } from '@packages/data-context'
import { e2eProjectDirs } from './e2eProjectDirs'
import type { AuthenticatedUserShape } from '@packages/data-context/src/data'
import type { DocumentNode, ExecutionResult } from 'graphql'
import type { OpenModeOptions } from '@packages/types'
import type { E2ETaskMap } from '../e2ePluginSetup'

const NO_TIMEOUT = 1000 * 1000
const FOUR_SECONDS = 4 * 1000

export type ProjectFixture = typeof e2eProjectDirs[number]

export interface WithCtxOptions extends Cypress.Loggable, Cypress.Timeoutable {
  projectName?: ProjectFixture
  [key: string]: any
}

export interface WithCtxInjected extends WithCtxOptions {
  require: typeof require
  process: typeof process
  testState: Record<string, any>
  projectDir(projectName: ProjectFixture): string
}

export interface RemoteGraphQLInterceptPayload {
  operationName?: string
  query: string
  variables: Record<string, any>
  document: DocumentNode
  result: ExecutionResult
}

export type RemoteGraphQLInterceptor = (obj: RemoteGraphQLInterceptPayload) => ExecutionResult | Promise<ExecutionResult>

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
       * Removes the sinon spy'ing on the remote GraphQL fake requests
       */
      disableRemoteGraphQLFakes(): void
      visitApp(href?: string): Chainable<AUTWindow>
      visitLaunchpad(href?: string): Chainable<AUTWindow>
    }
  }
}

cy.i18n = i18n

before(() => {
  Cypress.env('e2e_gqlPort', undefined)
  taskInternal('__internal__before', undefined).then(({ gqlPort }) => {
    Cypress.env('e2e_gqlPort', gqlPort)
  })
})

beforeEach(() => {
  // Reset the ports so we know we need to call "openProject" before each test
  Cypress.env('e2e_serverPort', undefined)
  taskInternal('__internal__beforeEach', undefined)
})

function scaffoldProject (projectName: ProjectFixture) {
  return logInternal({ name: 'scaffoldProject', message: projectName }, () => {
    return taskInternal('__internal_scaffoldProject', projectName)
  })
}

function addProject (projectName: ProjectFixture, open = false) {
  return logInternal({ name: 'addProject', message: projectName }, () => {
    return taskInternal('__internal_addProject', { projectName, open })
  })
}

export interface ResetOptionsResult {
  modeOptions: OpenModeOptions
  e2eServerPort?: number | null
}

function openGlobalMode (argv?: string[]) {
  return logInternal({ name: 'openGlobalMode', message: '' }, () => {
    return taskInternal('__internal_openGlobal', argv)
  }).then((obj) => {
    Cypress.env('e2e_serverPort', obj.e2eServerPort)

    return obj.modeOptions
  })
}

function openProject (projectName: ProjectFixture, argv: string[] = []) {
  if (!e2eProjectDirs.includes(projectName)) {
    throw new Error(`Unknown project ${projectName}`)
  }

  return logInternal({ name: 'openProject', message: argv.join(' ') }, () => {
    return taskInternal('__internal_openProject', { projectName, argv })
  }).then((obj) => {
    Cypress.env('e2e_serverPort', obj.e2eServerPort)

    return obj.modeOptions
  })
}

function startAppServer (mode: 'component' | 'e2e' = 'e2e') {
  return logInternal('startAppServer', (log) => {
    return cy.withCtx(async (ctx, o) => {
      ctx.actions.wizard.setTestingType(o.mode)
      await ctx.actions.project.initializeActiveProject({
        skipPluginInitializeForTesting: true,
      })

      await ctx.actions.project.launchProject(o.mode, {
        skipBrowserOpenForTest: true,
      })

      return ctx.appServerPort
    }, { log: false, mode }).then((serverPort) => {
      log.set({ message: `port: ${serverPort}` })
      Cypress.env('e2e_serverPort', serverPort)
    })
  })
}

function visitApp (href?: string) {
  const { e2e_serverPort, e2e_gqlPort } = Cypress.env()

  if (!e2e_serverPort) {
    throw new Error(`
      Missing serverPort, app was not initialized.
      Make sure you're adding args to openModeSystemTest which will launch the browser, such as:
      ['--e2e', '--browser', 'electron']
    `)
  }

  return cy.withCtx(async (ctx) => {
    return JSON.stringify(await ctx.html.fetchAppInitialData())
  }, { log: false }).then((ssrData) => {
    return cy.visit(`dist-app/index.html?serverPort=${e2e_serverPort}${href || ''}`, {
      onBeforeLoad (win) {
        // Simulates the inject SSR data when we're loading the page normally in the app
        win.__CYPRESS_INITIAL_DATA__ = JSON.parse(ssrData)
        win.__CYPRESS_GRAPHQL_PORT__ = e2e_gqlPort
      },
    })
  })
}

function visitLaunchpad () {
  return logInternal(`visitLaunchpad ${Cypress.env('e2e_gqlPort')}`, () => {
    return cy.visit(`dist-launchpad/index.html?gqlPort=${Cypress.env('e2e_gqlPort')}`, { log: false })
  })
}

type UnwrapPromise<R> = R extends PromiseLike<infer U> ? U : R

function withCtx<T extends Partial<WithCtxOptions>, R> (fn: (ctx: DataContext, o: T & WithCtxInjected) => Promise<R>, opts: T = {} as T): Cypress.Chainable<UnwrapPromise<R>> {
  const { log, timeout, ...rest } = opts

  const _log = log === false ? { end () {} } : Cypress.log({
    name: 'withCtx',
    message: '(view in console)',
    consoleProps () {
      return {
        'Executed': fn.toString(),
        timeout,
        options: rest,
      }
    },
  })

  return cy.task<UnwrapPromise<R>>('__internal_withCtx', {
    fn: fn.toString(),
    options: rest,
  }, { timeout: timeout ?? Cypress.env('e2e_isDebugging') ? NO_TIMEOUT : FOUR_SECONDS, log: Boolean(Cypress.env('e2e_isDebugging')) }).then((result) => {
    _log.end()

    return result
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

function remoteGraphQLIntercept (fn: RemoteGraphQLInterceptor) {
  return logInternal('remoteGraphQLIntercept', () => {
    return taskInternal('__internal_remoteGraphQLIntercept', fn.toString())
  })
}

type Resolved<V> = V extends Promise<infer U> ? U : V

/**
 * Run an internal task, as defined by e2ePluginSetup. Automatically tracks the types
 *
 */
function taskInternal<T extends keyof E2ETaskMap> (name: T, arg: Parameters<E2ETaskMap[T]>[0]) {
  const isDebugging = Boolean(Cypress.env('e2e_isDebugging'))

  return cy.task<Resolved<ReturnType<E2ETaskMap[T]>>>(name, arg, { log: isDebugging, timeout: isDebugging ? NO_TIMEOUT : FOUR_SECONDS })
}

function logInternal<T> (name: string | Partial<Cypress.LogConfig>, cb: (log: Cypress.Log) => Cypress.Chainable<T>, opts: Partial<Cypress.Loggable> = {}): Cypress.Chainable<T> {
  const _log = typeof name === 'string'
    ? Cypress.log({ name, message: '' })
    : Cypress.log(name)

  return cb(_log).then<T>((val) => {
    _log.end()

    return val
  })
}

Cypress.Commands.add('scaffoldProject', scaffoldProject)
Cypress.Commands.add('addProject', addProject)
Cypress.Commands.add('openGlobalMode', openGlobalMode)
Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('loginUser', loginUser)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('startAppServer', startAppServer)
Cypress.Commands.add('openProject', openProject)
Cypress.Commands.add('withCtx', withCtx)
Cypress.Commands.add('remoteGraphQLIntercept', remoteGraphQLIntercept)
