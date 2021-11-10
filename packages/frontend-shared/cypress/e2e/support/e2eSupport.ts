import '@testing-library/cypress/add-commands'
import type { DataContext } from '@packages/data-context'
import { e2eProjectDirs } from './e2eProjectDirs'
import type { AuthenticatedUserShape } from '@packages/data-context/src/data'
import type { DocumentNode, ExecutionResult } from 'graphql'

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
       * Calls a function block with the "ctx" object from the server,
       * and an object containing any options passed into the server context
       * and some helper properties:
       *
       *
       * You cannot access any variables outside of the function scope,
       * however we do provide expect, chai, sinon
       */
      withCtx: typeof withCtx
      /**
       * Takes the name of a system-tests directory, and mounts the project within open mode
       */
      openE2E: typeof openE2E
      /**
       * Takes the name of a system-tests directory and scaffolds the project, without opening
       */
      addProject: typeof addProject
      /**
       * Ensures there's an app server for a project and visits the app
       */
      initializeApp: typeof initializeApp
      /**
       * Simulates a user logged-in to the cypress app
       */
      loginUser: typeof loginUser
      /**
       * Gives the ability to intercept the remote GraphQL request & respond accordingly
       */
      remoteGraphQLIntercept: typeof remoteGraphQLIntercept
      /**
       * Removes the sinon spy'ing on the remote GraphQL fake requests
       */
      disableRemoteGraphQLFakes(): void
      visitApp(href?: string): Chainable<string>
      visitLaunchpad(href?: string): Chainable<string>
    }
  }
}

beforeEach(() => {
  // Reset the ports, and call the __internal__beforeEach which sets up a
  // fresh data context for each test
  Cypress.env('e2e_serverPort', undefined)
  Cypress.env('e2e_gqlPort', undefined)
  cy.task<{ gqlPort: number }>('__internal__beforeEach', {}, { log: false }).then(({ gqlPort }) => {
    Cypress.env('e2e_gqlPort', gqlPort)
    Cypress.env('e2e_serverPort', undefined)
  })
})

function addProject (projectName: ProjectFixture) {
  return logInternal({ name: 'addProject', message: projectName }, () => {
    return cy.task('__internal_addProject', projectName, { log: false })
  })
}

function openE2E (projectName?: ProjectFixture) {
  if (projectName && !e2eProjectDirs.includes(projectName)) {
    throw new Error(`Unknown project ${projectName}`)
  }

  if (projectName) {
    cy.task('__internal_addProject', projectName, { log: false })
  }

  return cy.withCtx(async (ctx, o) => {
    if (o.projectName) {
      await ctx.actions.project.setActiveProject(o.projectDir(o.projectName))
    }

    return [
      ctx.gqlServerPort,
      ctx.appServerPort,
    ]
  }, { projectName, log: false }).then(([gqlPort, serverPort]) => {
    Cypress.env('e2e_serverPort', serverPort)
  })
}

function initializeApp (mode: 'component' | 'e2e' = 'e2e') {
  return cy.withCtx(async (ctx, o) => {
    ctx.actions.wizard.setTestingType(o.mode)
    await ctx.actions.project.initializeActiveProject({
      skipPluginIntializeForTesting: true,
    })

    await ctx.actions.project.launchProject(o.mode, {
      skipBrowserOpenForTest: true,
    })

    return ctx.appServerPort
  }, { log: false, mode }).then((serverPort) => {
    Cypress.env('e2e_serverPort', serverPort)
  })
}

function visitApp (href?: string) {
  const { e2e_serverPort, e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.openE2E(...) ?`)
  }

  if (!e2e_serverPort) {
    throw new Error(`Missing serverPort - did you forget to call cy.initializeApp(...) ?`)
  }

  cy.withCtx(async (ctx) => {
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
  const { e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.openE2E(...) ?`)
  }

  cy.visit(`dist-launchpad/index.html?gqlPort=${e2e_gqlPort}`)
}

type UnwrapPromise<R> = R extends PromiseLike<infer U> ? U : R

function withCtx<T extends Partial<WithCtxOptions>, R> (fn: (ctx: DataContext, o: T & WithCtxInjected) => R, opts: T = {} as T): Cypress.Chainable<UnwrapPromise<R>> {
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
  }, { timeout: timeout ?? Cypress.env('e2e_isDebugging') ? NO_TIMEOUT : FOUR_SECONDS, log: false }).then((result) => {
    _log.end()

    return result
  })
}

function loginUser (userShape: Partial<AuthenticatedUserShape> = {}) {
  return logInternal({ name: 'loginUser', message: JSON.stringify(userShape) }, () => {
    return cy.withCtx((ctx, o) => {
      ctx.coreData.user = {
        authToken: '1234',
        email: 'test@example.com',
        name: 'Test User',
        ...o.userShape,
      }
    }, { log: false, userShape })
  })
}

function remoteGraphQLIntercept (fn: RemoteGraphQLInterceptor) {
  return logInternal('remoteGraphQLIntercept', () => {
    return cy.task<null>('__internal_remoteGraphQLIntercept', fn.toString(), { log: false })
  })
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

Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('loginUser', loginUser)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('addProject', addProject)
Cypress.Commands.add('initializeApp', initializeApp)
Cypress.Commands.add('openE2E', openE2E)
Cypress.Commands.add('withCtx', withCtx)
Cypress.Commands.add('remoteGraphQLIntercept', remoteGraphQLIntercept)
