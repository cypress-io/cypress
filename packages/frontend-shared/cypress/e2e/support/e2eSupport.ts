import type { DataContext } from '@packages/data-context'
import { e2eProjectPaths } from './e2eProjectRegistry'

const NO_TIMEOUT = 1000 * 1000
const FOUR_SECONDS = 4 * 1000

export type ProjectFixture = keyof typeof e2eProjectPaths

export interface WithCtxOptions extends Cypress.Loggable, Cypress.Timeoutable {
  projectName?: string
  [key: string]: any
}

export interface WithCtxInjected {
  testState: Record<string, any>
  require: typeof require
  process: typeof process
}

declare global {
  namespace Cypress {
    interface Chainable {
      withCtx: typeof withCtx
      setupE2E: typeof setupE2E
      openProject: typeof openProject
      initializeApp: typeof initializeApp
      visitApp(href?: string): Chainable<string>
      visitLaunchpad(href?: string): Chainable<string>
      /**
       * Get the project path for testing opening a new project
       */
      e2eProjectPath(project: ProjectFixture): string
      // graphqlRequest(): Chainable<string>
    }
  }
}

beforeEach(() => {
  cy.e2eProjectPath = (project: ProjectFixture) => {
    return e2eProjectPaths[project]
  }

  // Reset the ports so we know we need to call "setupE2E" before each test
  Cypress.env('e2e_serverPort', undefined)
  Cypress.env('e2e_gqlPort', undefined)
})

// function setup

function setupE2E (projectName?: ProjectFixture) {
  if (projectName && !e2eProjectPaths[projectName]) {
    throw new Error(`Unknown project ${projectName}`)
  }

  return cy.withCtx(async (ctx, o) => {
    await ctx.dispose()
    if (o.projectName) {
      await ctx.actions.project.setActiveProject(o.e2eProjectPaths[o.projectName])
    }

    return [
      ctx.gqlServerPort,
      ctx.appServerPort,
    ]
  }, { projectName, e2eProjectPaths, log: false }).then(([gqlPort, serverPort]) => {
    Cypress.env('e2e_gqlPort', gqlPort)
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

function openProject (projectName?: ProjectFixture) {
  return cy.withCtx((ctx, o) => {
    if (o.projectName) {
      ctx.actions.project.setActiveProject(o.e2eProjectPaths[o.projectName])
    }
  }, { log: false, projectName, e2eProjectPaths })
}

function visitApp () {
  const { e2e_serverPort, e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.setupE2E(...) ?`)
  }

  if (!e2e_serverPort) {
    throw new Error(`Missing serverPort - did you forget to call cy.initializeApp(...) ?`)
  }

  return cy.visit(`dist-app/index.html?gqlPort=${e2e_gqlPort}&serverPort=${e2e_serverPort}`)
}

function visitLaunchpad (hash?: string) {
  const { e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.setupE2E(...) ?`)
  }

  cy.visit(`dist-launchpad/index.html?gqlPort=${e2e_gqlPort}`)
}

function withCtx<T extends Partial<WithCtxOptions>> (fn: (ctx: DataContext, o: T & WithCtxInjected) => any, opts: T = {} as T): Cypress.Chainable {
  const _log = opts.log === false ? { end () {} } : Cypress.log({
    name: 'withCtx',
    message: '(view in console)',
    consoleProps () {
      return {
        'Executed': fn.toString(),
      }
    },
  })

  const { log, timeout, ...rest } = opts

  return cy.task('withCtx', {
    fn: fn.toString(),
    options: rest,
    // @ts-expect-error
    activeTestId: Cypress.mocha.getRunner().test.id ?? Cypress.currentTest.title,
  }, { timeout: timeout ?? Cypress.env('e2e_isDebugging') ? NO_TIMEOUT : FOUR_SECONDS, log }).then(() => {
    _log.end()
  })
}

Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('initializeApp', initializeApp)
Cypress.Commands.add('openProject', openProject)
Cypress.Commands.add('setupE2E', setupE2E)
Cypress.Commands.add('withCtx', withCtx)
