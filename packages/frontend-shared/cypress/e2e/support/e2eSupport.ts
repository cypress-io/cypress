import '@testing-library/cypress/add-commands'
import type { DataContext } from '@packages/data-context'
import { e2eProjectDirs } from './e2eProjectDirs'

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
       * Takes the name of a "system" test directory, and mounts the project within open mode
       */
      setupE2E: typeof setupE2E
      initializeApp: typeof initializeApp
      visitApp(href?: string): Chainable<string>
      visitLaunchpad(href?: string): Chainable<string>
    }
  }
}

beforeEach(() => {
  // Reset the ports so we know we need to call "setupE2E" before each test
  Cypress.env('e2e_serverPort', undefined)
  Cypress.env('e2e_gqlPort', undefined)
})

// function setup

function setupE2E (projectName?: ProjectFixture) {
  if (projectName && !e2eProjectDirs.includes(projectName)) {
    throw new Error(`Unknown project ${projectName}`)
  }

  if (projectName) {
    cy.task('setupE2E', projectName, { log: false })
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

function visitApp (href?: string) {
  const { e2e_serverPort, e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.setupE2E(...) ?`)
  }

  if (!e2e_serverPort) {
    throw new Error(`Missing serverPort - did you forget to call cy.initializeApp(...) ?`)
  }

  return cy.visit(`dist-app/index.html?gqlPort=${e2e_gqlPort}&serverPort=${e2e_serverPort}${href || ''}`)
}

function visitLaunchpad (hash?: string) {
  const { e2e_gqlPort } = Cypress.env()

  if (!e2e_gqlPort) {
    throw new Error(`Missing gqlPort - did you forget to call cy.setupE2E(...) ?`)
  }

  cy.visit(`dist-launchpad/index.html?gqlPort=${e2e_gqlPort}`)
}

const pageLoadId = `uid${Math.random()}`

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
    activeTestId: `${pageLoadId}-${Cypress.mocha.getRunner().test.id ?? Cypress.currentTest.title}`,
  }, { timeout: timeout ?? Cypress.env('e2e_isDebugging') ? NO_TIMEOUT : FOUR_SECONDS, log }).then(() => {
    _log.end()
  })
}

Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('initializeApp', initializeApp)
Cypress.Commands.add('setupE2E', setupE2E)
Cypress.Commands.add('withCtx', withCtx)
