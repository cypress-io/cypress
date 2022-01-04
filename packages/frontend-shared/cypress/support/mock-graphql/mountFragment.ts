import { makeClientTestContext, ClientTestContext } from './clientTestContext'
import '@testing-library/cypress/add-commands'
import type { MountingOptions } from '@vue/test-utils'
import { mount, CyMountOptions } from '@cypress/vue'
import urql, { TypedDocumentNode, useQuery } from '@urql/vue'
import { print, FragmentDefinitionNode } from 'graphql'
import { testUrqlClient } from './clientTestUrqlClient'
import { Component, computed, watch, defineComponent, h, toRaw } from 'vue'
import { each } from 'lodash'
import { createI18n } from '@cy/i18n'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */

(window as any).ipc = {
  on: () => {},
  send: () => {},
}

export interface MountFnOptions {
  plugins?: (() => any)[]
}

export const registerMountFn = ({ plugins }: MountFnOptions = {}) => {
  Cypress.Commands.add(
    'mount',
    // @ts-ignore todo: figure out the correct types
    <C extends Parameters<typeof mount>[0]>(comp: C, options: CyMountOptions<C> = {}) => {
      options.global = options.global || {}
      options.global.stubs = options.global.stubs || {}
      options.global.stubs.transition = false
      options.global.plugins = options.global.plugins || []
      each(plugins, (pluginFn: () => any) => {
        options?.global?.plugins?.push(pluginFn())
      })

      options.global.plugins.push(createI18n())

      const context = makeClientTestContext()

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient(context))
        },
      })

      return mount(comp, options)
    },
  )

  function mountFragment<Result, Variables, T extends TypedDocumentNode<Result, Variables>> (source: T, options: MountFragmentConfig<T>, list: boolean = false): Cypress.Chainable<ClientTestContext> {
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
              app.use(urql, testUrqlClient(context, options.onResult))
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

  Cypress.Commands.add('mountFragment', mountFragment)

  Cypress.Commands.add('mountFragmentList', (source, options) => {
    // @ts-expect-error - todo: tim fix
    return mountFragment(source, options, true)
  })
}

type ResultType<T> = T extends TypedDocumentNode<infer U, any> ? U : never

type MountFragmentConfig<T extends TypedDocumentNode> = {
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>) => JSX.Element
  onResult?: (result: ResultType<T>, ctx: ClientTestContext) => ResultType<T> | void
  expectError?: boolean
} & CyMountOptions<unknown>

type MountFragmentListConfig<T extends TypedDocumentNode> = {
  /**
   * @default 2
   */
  count?: number
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>[]) => JSX.Element
  onResult?: (result: ResultType<T>, ctx: ClientTestContext) => ResultType<T> | void
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
      mountFragment<Result, Variables, T extends TypedDocumentNode<Result, Variables>>(
        fragment: T,
        config: MountFragmentConfig<T>
      ): Cypress.Chainable<ClientTestContext>
      /**
       * Mount helper for a component with a GraphQL fragment, as a list
       */
      mountFragmentList<Result, Variables, T extends TypedDocumentNode<Result, Variables>>(
        fragment: T,
        config: MountFragmentListConfig<T>
      ): Cypress.Chainable<ClientTestContext>
    }
  }
}
