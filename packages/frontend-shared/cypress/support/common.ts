import '@testing-library/cypress/add-commands'
import type { MountingOptions } from '@vue/test-utils'
import { mount, CyMountOptions } from '@cypress/vue'
import urql, { TypedDocumentNode, useQuery } from '@urql/vue'
import { print, FragmentDefinitionNode } from 'graphql'
import { ClientTestContext, testUrqlClient } from '@packages/frontend-shared/src/graphql/testUrqlClient'
import { Component, computed, watch, defineComponent, h } from 'vue'
import * as stubCloudData from '../../src/graphql/testStubCloudTypes'
import * as stubData from '../../src/graphql/testStubData'

import type { CodegenTypeMap } from '@packages/frontend-shared/src/generated/test-graphql-types.gen'
import { each, cloneDeep } from 'lodash'
import 'cypress-file-upload'
import { navigationMenu as stubNavigationMenu } from '../../src/graphql/testNavigationMenu'
import { stubQuery } from '../../src/graphql/testQuery'
import { stubWizard } from '../../src/graphql/testWizard'
import { stubApp as stubApp } from '../../src/graphql/testApp'
import { createI18n } from '@cy/i18n'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
;(window as any).ipc = {
  on: () => {},
  send: () => {},
}

const createContext = (): ClientTestContext => {
  return cloneDeep({
    stubApp,
    stubWizard,
    stubCloudData,
    stubData,
    stubQuery,
    stubNavigationMenu,
  })
}

export interface MountFnOptions {
  plugins?: (() => any)[]
}

export const registerMountFn = ({ plugins }: MountFnOptions = {}) => {
  Cypress.Commands.add(
    'mount',
    <C extends Parameters<typeof mount>[0]>(comp: C, options: CyMountOptions<C> = {}) => {
      options.global = options.global || {}
      options.global.stubs = options.global.stubs || {}
      options.global.stubs.transition = false
      options.global.plugins = options.global.plugins || []
      each(plugins, (pluginFn: () => any) => {
        options?.global?.plugins?.push(pluginFn())
      })

      options.global.plugins.push(createI18n())

      const context = createContext()

      options.global.plugins.push({
        install (app) {
          app.use(urql, testUrqlClient({
            context,
            rootValue: context,
          }))
        },
      })

      return mount(comp, options)
    },
  )

  function mountFragment<Result, Variables, T extends TypedDocumentNode<Result, Variables>> (source: T, options: MountFragmentConfig<T>, list: boolean = false): Cypress.Chainable<ClientTestContext> {
    let hasMounted = false
    const context = createContext()
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
              app.use(urql, testUrqlClient({
                context,
                rootValue: {
                  [fieldName]: options.type?.(context) ?? {},
                },
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
    ? V extends keyof CodegenTypeMap
      ? CodegenTypeMap[V]
      : never
    : never
  : never

type MountFragmentConfig<T extends TypedDocumentNode> = {
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>) => JSX.Element
  type?: (ctx: ClientTestContext) => GetRootType<T>
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
