import type { DataContext } from '@packages/data-context'
import { e2eProjectPaths } from './e2eProjectRegistry'

const SIXTY_SECONDS = 60 * 1000

export type ProjectFixture = keyof typeof e2eProjectPaths

export interface WithCtxOptions extends Cypress.Loggable, Cypress.Timeoutable {
  projectName?: string
}

declare global {
  namespace Cypress {
    interface Chainable {
      withCtx<T extends Partial<WithCtxOptions>>(fn: (ctx: DataContext, o: T) => any, options?: T): Chainable
      setupE2E: typeof setupE2E
      openProject: typeof openProject
      initializeApp: typeof initializeApp
      visitApp(href?: string): Chainable<string>
      visitLaunchpad(href?: string): Chainable<string>
      // graphqlRequest(): Chainable<string>
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

Cypress.Commands.add('visitApp', visitApp)
Cypress.Commands.add('visitLaunchpad', visitLaunchpad)
Cypress.Commands.add('initializeApp', initializeApp)
Cypress.Commands.add('openProject', openProject)
Cypress.Commands.add('setupE2E', setupE2E)

Cypress.Commands.add('withCtx', (fn, opts: Partial<WithCtxOptions> = {}) => {
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

  cy.task('withCtx', {
    fn: fn.toString(),
    options: rest,
  }, { timeout: timeout ?? SIXTY_SECONDS, log }).then(() => {
    _log.end()
  })
})
