import { mount, CyMountOptions } from '@cypress/vue'
import urql, { TypedDocumentNode } from '@urql/vue'
import { print, graphql, OperationDefinitionNode } from 'graphql'

import { testApolloClient } from './testApolloClient'
import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'
import { Component } from 'vue'
import { graphqlSchema } from '@packages/server/lib/graphql/schema'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
(window as any).ipc = {
  on: () => {},
  send: () => {},
}

type SetupContext = (ctx: ClientTestContext) => ClientTestContext | void

type SetupContextOpts = {
  setupContext?: SetupContext
}

Cypress.Commands.add(
  'mount',
  <C extends Component>(comp: C, options: CyMountOptions<C> & SetupContextOpts = {}) => {
    const { setupContext, ...opts } = options

    opts.global = opts.global || {}

    opts.global.plugins = opts.global.plugins || []
    opts.global.plugins.push({
      install (app) {
        const testCtx = new ClientTestContext()
        const ctx = setupContext ? setupContext(testCtx) : testCtx

        app.use(urql, testApolloClient(ctx || testCtx))
      },
    })

    return mount(comp, opts)
  },
)

interface CyGraphQLOptions<Variables> {
  testContext?: ClientTestContext
  variableValues?: Variables
}

Cypress.Commands.add(
  'graphql',
  function <Result, Variables> (source: TypedDocumentNode<Result, Variables>, options: CyGraphQLOptions<Variables> = {}): Cypress.Chainable<Result> {
    const result = graphql({
      contextValue: options.testContext ?? new ClientTestContext(),
      schema: graphqlSchema,
      source: print(source),
    })

    const op = source.definitions.find((def) => def.kind === 'OperationDefinition') as OperationDefinitionNode

    if (!op) {
      throw new Error(`Expected an operation in ${print(source)}`)
    }

    Cypress.log({
      name: `graphql`,
      message: op.name?.value,
      consoleProps () {
        return {
          operation: op.operation,
          document: print(source),
          variableValues: options.variableValues ?? {},
        }
      },
      autoEnd: true,

    })

    return cy.wrap(result.then((result) => {
      if (result.data) {
        return result.data
      }

      throw result.errors?.[0]
    }), { log: false }) as unknown as Cypress.Chainable<Result>
  },
)

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Install all vue plugins and globals then mount
       */
      mount<Props = any>(comp: Component<Props>, options?: CyMountOptions<Props> & SetupContextOpts): Cypress.Chainable<any>
      /**
       * Executes a fragment query
       */
      graphql<Result, Variables>(source: TypedDocumentNode<Result, Variables>, options?: CyGraphQLOptions<Variables>): Cypress.Chainable<Result>
    }
  }
}
