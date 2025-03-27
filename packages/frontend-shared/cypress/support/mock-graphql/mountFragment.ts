import type { ClientTestContext } from './clientTestContext'
import { makeClientTestContext } from './clientTestContext'
import '@testing-library/cypress/add-commands'
import type { MountingOptions } from '@vue/test-utils'
// tslint:disable-next-line: no-implicit-dependencies - requires cypress
import type { CyMountOptions } from 'cypress/vue'
// tslint:disable-next-line: no-implicit-dependencies - requires cypress
import { mount } from 'cypress/vue'
import urql, { useQuery } from '@urql/vue'
import type { TypedDocumentNode } from '@urql/vue'
import type { FragmentDefinitionNode } from 'graphql'
import { print } from 'graphql'
import { SubscriptionHook, testUrqlClient } from './clientTestUrqlClient'
import type { MutationResolverCallback as MutationResolver } from './clientTestUrqlClient'
import type { Component } from 'vue'
import { computed, watch, defineComponent, h, toRaw } from 'vue'
import { each } from 'lodash'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these tsconfig compiler paths
import { createI18n } from '@cy/i18n'
import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'
import { getOperationNameFromDocument } from './clientTestUtils'

export interface MountFnOptions {
  plugins?: (() => any)[]
}

export const registerMountFn = ({ plugins }: MountFnOptions = {}) => {
  Cypress.Commands.add(
    'mount',
    // @ts-ignore todo: figure out the correct types
    <C extends Parameters<typeof mount>[0]>(comp: C, options: Parameters<typeof mount>[1] = {}) => {
      options.global = options.global || {}
      options.global.stubs = options.global.stubs || {}
      if (!Array.isArray(options.global.stubs)) {
        options.global.stubs.transition = false
        options.global.stubs['transition-group'] = false
      }

      options.global.plugins = options.global.plugins || []
      each(plugins, (pluginFn: () => any) => {
        options?.global?.plugins?.push(pluginFn())
      })

      options.global.plugins.push(createI18n())

      const context = makeClientTestContext()

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient(context, undefined, mutationResolvers, registerSubscriptionHook))
        },
      })

      // @ts-ignore todo: figure out the correct types
      return mount(comp, options)
    },
  )

  function mountFragment<T extends TypedDocumentNode<any, any>> (source: T, options: MountFragmentConfig<T>, list: boolean = false): Cypress.Chainable<any> {
    let hasMounted = false
    const context = makeClientTestContext()
    const fieldName = list ? 'testFragmentMemberList' : 'testFragmentMember'

    const mountingOptions: MountingOptions<any, any> = {
      global: {
        stubs: {
          transition: false,
          'transition-group': false,
        },
        plugins: [
          createI18n(),
          {
            install (app) {
              app.use(urql, testUrqlClient(context, options.onResult, mutationResolvers, registerSubscriptionHook))
            },
          },
        ],
      },
    }

    each(plugins, (pluginFn: () => any) => {
      mountingOptions?.global?.plugins?.push(pluginFn())
    })

    let queryVariablesSegment = ''

    if (options.variableTypes) {
      queryVariablesSegment = Object.entries(options.variableTypes || {}).map(([name, type]) => `\$${name}: ${type}`).join(',')
      queryVariablesSegment = `(${queryVariablesSegment})`
    }

    // @ts-ignore todo: figure out the correct types
    return mount(defineComponent({
      name: `MountFragment`,
      setup () {
        const result = useQuery({
          variables: options.variables,
          query: `
            query MountFragmentTest${queryVariablesSegment} {
              ${fieldName} {
                ...${(source.definitions[0] as FragmentDefinitionNode).name.value}
              }
            }
            ${print(source)}
          `,
        })

        if (!options.expectError) {
          watch(result.error, (o) => {
            if (result.error.value) {
              const err = toRaw(result.error.value)

              cy.log('GraphQL Error', err).then(() => {
                throw err
              })
            }
          })
        }

        return {
          gql: computed(() => result.data.value?.[fieldName]),
        }
      },
      render: (props) => {
        if (props.gql && !hasMounted) {
          hasMounted = true
          Cypress.log({
            displayName: 'gql',
            message: toRaw((source.definitions[0] as FragmentDefinitionNode).name.value),
            consoleProps () {
              return JSON.parse(JSON.stringify({
                gql: toRaw(props.gql),
                source: print(source),
              }))
            },
          })?.end()
        }

        return props.gql ? options.render(props.gql) : h('div')
      },
    }), mountingOptions)
  }

  const mutationResolvers: Map<string, MutationResolver<any>> = new Map()

  function stubMutationResolver<T extends TypedDocumentNode<any, any>> (
    document: T,
    resolver: MutationResolver<T>,
  ) {
    const definition = document.definitions[0]

    if (definition.kind === 'OperationDefinition' && definition.name) {
      mutationResolvers.set(definition.name.value, resolver)
    } else {
      throw new Error('only use mutation documents in stubMutationResolver first argument')
    }
  }

  const subscriptionHooks: Map<string, SubscriptionHook> = new Map()

  function registerSubscriptionHook (name: string, hook: SubscriptionHook) {
    subscriptionHooks.set(name, hook)
  }

  function stubSubscriptionEvent <T extends TypedDocumentNode<any, any>> (
    document: T,
    emitEvent: () => ResultOf<T>,
  ) {
    const name = getOperationNameFromDocument(document, 'subscription')

    Cypress.log({
      name: 'subscription event',
      message: name,
      consoleProps: () => {
        return {
          document,
        }
      },
    })

    const hook = subscriptionHooks.get(name)

    if (hook) {
      hook(emitEvent())
    } else {
      const error = `No subscription hook found for ${name}`

      cy.log('GraphQL Error', error).then(() => {
        throw error
      })
    }
  }

  Cypress.Commands.add('mountFragment', mountFragment)

  Cypress.Commands.add('stubMutationResolver', stubMutationResolver)

  Cypress.Commands.add('stubSubscriptionEvent', stubSubscriptionEvent)

  Cypress.Commands.add('mountFragmentList', (source, options) => {
    return mountFragment(source, options, true)
  })

  beforeEach(() => {
    // clean all resolvers after each test
    mutationResolvers.clear()
  })
}

type MountFragmentConfig<T extends TypedDocumentNode<any, any>> = {
  /**
   * Dictionary of GQL variable names to their GQL data type (String, Boolean!, etc)
   * for any variables that are used in the fragment.
   * This should be used in conjunction with `variables`
   */
  variableTypes?: Record<keyof VariablesOf<T>, string>
  /**
   * Dictionary of variable names to their values for any variables that are used in the
   * fragment. This should be used in conjunction with `variableTypes`
   */
  variables?: VariablesOf<T>
  /**
   * When we are mounting a GraphQL Fragment, we can use `onResult`
   * to intercept the result and modify the contents on the fragment
   * before rendering the component
   */
  onResult?: (result: ResultOf<T>, ctx: ClientTestContext) => ResultOf<T> | void
  /**
   * Render is passed the result of the "frag" and mounts the component under test
   */
  render: (frag: Exclude<ResultOf<T>, undefined>) => JSX.Element
  expectError?: boolean
} & CyMountOptions<unknown>

type MountFragmentListConfig<T extends TypedDocumentNode<any, any>> = {
  /**
   * @default 2
   */
  count?: number
  variableTypes?: Record<keyof VariablesOf<T>, string>
  variables?: VariablesOf<T>
  render: (frag: Exclude<ResultOf<T>, undefined>[]) => JSX.Element
  onResult?: (result: ResultOf<T>, ctx: ClientTestContext) => ResultOf<T> | void
  expectError?: boolean
} & CyMountOptions<unknown>

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Install all vue plugins and globals then mount
       */
      mount<Props = any>(comp: Component<Props>, options?: CyMountOptions<Props>): Cypress.Chainable<any>
      /**
       * Mount helper for a component with a GraphQL fragment
       */
      mountFragment<T extends TypedDocumentNode<any, any>>(
        fragment: T,
        config: MountFragmentConfig<T>
      ): Cypress.Chainable<any>

      /**
       * mock a mutation resolver when needed to spy on it or modify the result
       * @param document
       * @param resolver
       */
      stubMutationResolver<T extends TypedDocumentNode<any, any>>(
        document: T,
        resolver: MutationResolver<T>
      ): Cypress.Chainable<ClientTestContext>
      /**
       * Mount helper for a component with a GraphQL fragment, as a list
       */
      mountFragmentList<T extends TypedDocumentNode<any, any>>(
        fragment: T,
        config: MountFragmentListConfig<T>
      ): Cypress.Chainable<any>

      /**
       * Helper to register an event to be returned when testing subscriptions
       * @param document document type for the subscription
       * @param emitEvent callback that you must call with the document result to pass to the subscription event
       *
       * Example:
       * cy.stubSubscriptionEvent(DebugPendingRunSplash_SpecsDocument, () => {
       *   return {
       *     __typename: 'Subscription' as const,
       *     cloudNode: {
       *       __typename: 'CloudRun' as const,
       *       id: 'fake',
       *       totalSpecs: total,
       *       completedSpecs: completed,
       *       scheduledToCompleteAt,
       *     },
       *   }
       * })
       *
       */
      stubSubscriptionEvent<T extends TypedDocumentNode<any, any>>(
        document: T,
        emitEvent: () => ResultOf<T>
      ): Cypress.Chainable<ClientTestContext>
    }
  }
}
