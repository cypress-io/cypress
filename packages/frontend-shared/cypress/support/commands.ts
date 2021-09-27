import '@testing-library/cypress/add-commands'
import type { MountingOptions } from '@vue/test-utils'
import { mount, CyMountOptions } from '@cypress/vue'
import urql, { TypedDocumentNode, useQuery } from '@urql/vue'
import { print, FragmentDefinitionNode } from 'graphql'
import { testUrqlClient } from '@packages/frontend-shared/src/graphql/testUrqlClient'
import { Component, computed, watch, defineComponent, h } from 'vue'
import { ClientTestContext } from '../../src/graphql/ClientTestContext'
import type { TestSourceTypeLookup } from '@packages/graphql/src/testing/testUnionType'
import { each } from 'lodash'
import 'cypress-file-upload'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
;(window as any).ipc = {
  on: () => {},
  send: () => {},
}

export const registerMountFn = ({ plugins }) => {
  Cypress.Commands.add(
    'mount',
    <C extends Parameters<typeof mount>[0]>(comp: C, options: CyMountOptions<C> = {}) => {
      const context = new ClientTestContext({
        config: {},
        cwd: '/dev/null',
        // @ts-ignore
        browser: null,
        global: false,
        project: '/dev/null',
        projectRoot: '/dev/null',
        invokedFromCli: true,
        testingType: 'e2e',
        os: 'darwin',
        _: [''],
      }, {})

      options.global = options.global || {}
      options.global.stubs = options.global.stubs || {}
      options.global.stubs.transition = false
      options.global.plugins = options.global.plugins || []
      each(plugins, (pluginFn: () => any) => {
        options?.global?.plugins?.push(pluginFn())
      })

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient({
            context,
          }))
        },
      })

      return mount(comp, options)
    },
  )

  function mountFragment<Result, Variables, T extends TypedDocumentNode<Result, Variables>> (source: T, options: MountFragmentConfig<T>, list: boolean = false): Cypress.Chainable<ClientTestContext> {
    const context = new ClientTestContext({
      config: {},
      cwd: '/dev/null',
      // @ts-ignore
      browser: null,
      global: false,
      project: '/dev/null',
      projectRoot: '/dev/null',
      invokedFromCli: true,
      testingType: 'e2e',
      os: 'darwin',
      _: [''],
    }, {})

    let hasMounted = false

    const mountingOptions: MountingOptions<any, any> = {
      global: {
        stubs: {
          transition: false,
        },
        plugins: [
          {
            install (app) {
              app.use(urql, testUrqlClient({
                context,
                rootValue: options.type(context),
              }))
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
        const fieldName = list ? 'testFragmentMemberList' : 'testFragmentMember'
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
              cy.log('GraphQL Error', result.error.value).then(() => {
                throw result.error.value
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
            message: (source.definitions[0] as FragmentDefinitionNode).name.value,
            consoleProps () {
              return {
                gql: props.gql,
                source: print(source),
              }
            },
          }).end()
        }

        return props.gql ? options.render(props.gql) : h('div')
      },
    }), mountingOptions).then(() => context)
  }

  Cypress.Commands.add('mountFragment', mountFragment)

  Cypress.Commands.add('mountFragmentList', (source, options) => {
    return mountFragment(source, options, true)
  })
}

type GetRootType<T> = T extends TypedDocumentNode<infer U, any>
  ? U extends { __typename?: infer V }
    ? V extends keyof TestSourceTypeLookup
      ? TestSourceTypeLookup[V]
      : never
    : never
  : never

type MountFragmentConfig<T extends TypedDocumentNode> = {
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>) => JSX.Element
  type: (ctx: ClientTestContext) => GetRootType<T>
  expectError?: boolean
} & CyMountOptions<unknown>

type MountFragmentListConfig<T extends TypedDocumentNode> = {
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>[]) => JSX.Element
  type: (ctx: ClientTestContext) => GetRootType<T>[]
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
