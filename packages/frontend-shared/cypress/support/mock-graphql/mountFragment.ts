import type { ClientTestContext } from './clientTestContext'
import { makeClientTestContext } from './clientTestContext'
import '@testing-library/cypress/add-commands'
import type { MountingOptions } from '@vue/test-utils'
import type { CyMountOptions } from 'cypress/vue'
import { mount } from 'cypress/vue'
import urql, { useQuery } from '@urql/vue'
import type { TypedDocumentNode } from '@urql/vue'
import type { FragmentDefinitionNode } from 'graphql'
import { print } from 'graphql'
import { testUrqlClient } from './clientTestUrqlClient'
import type { MutationResolverCallback as MutationResolver } from './clientTestUrqlClient'
import type { Component } from 'vue'
import { computed, watch, defineComponent, h, toRaw } from 'vue'
import { each } from 'lodash'
import { createI18n } from '@cy/i18n'
import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'

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
      }

      options.global.plugins = options.global.plugins || []
      each(plugins, (pluginFn: () => any) => {
        options?.global?.plugins?.push(pluginFn())
      })

      options.global.plugins.push(createI18n())

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient(context, undefined, mutationResolvers))
        },
      })

      const context = makeClientTestContext()

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient(context))
        },
      })

      return mount(comp, options)
    },
  )

  function mountFragment<T extends TypedDocumentNode<any, any>> (source: T, options: MountFragmentConfig<T>, list: boolean = false): Cypress.Chainable<ClientTestContext> {
    let hasMounted = false
    const context = makeClientTestContext()
    const fieldName = list ? 'testFragmentMemberList' : 'testFragmentMember'

    const mountingOptions: MountingOptions<any, any> = {
      global: {
        stubs: {
          transition: false,
        },
        plugins: [
          createI18n(),
          {
            install (app) {
              app.use(urql, testUrqlClient(context, options.onResult, mutationResolvers))
            },
          },
        ],
      },
    }

    each(plugins, (pluginFn: () => any) => {
      mountingOptions?.global?.plugins?.push(pluginFn())
    })

    return mount(defineComponent({
      name: `MountFragment`,
      setup () {
        const result = useQuery({
          query: `
            query MountFragmentTest {
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
          }).end()
        }

        return props.gql ? options.render(props.gql) : h('div')
      },
    }), mountingOptions).then(() => context)
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

  Cypress.Commands.add('mountFragment', mountFragment)

  Cypress.Commands.add('stubMutationResolver', stubMutationResolver)

  Cypress.Commands.add('mountFragmentList', (source, options) => {
    // @ts-expect-error - todo: tim fix
    return mountFragment(source, options, true)
  })

  beforeEach(() => {
    // clean all resolvers after each test
    mutationResolvers.clear()
  })
}

type MountFragmentConfig<T extends TypedDocumentNode<any, any>> = {
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
      ): Cypress.Chainable<ClientTestContext>

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
      ): Cypress.Chainable<ClientTestContext>
    }
  }
}
