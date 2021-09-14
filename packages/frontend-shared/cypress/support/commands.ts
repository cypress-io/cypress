import '@testing-library/cypress/add-commands'
import { mount, CyMountOptions } from '@cypress/vue'
import urql, { TypedDocumentNode, useQuery } from '@urql/vue'
import { print, FragmentDefinitionNode } from 'graphql'
import { testUrqlClient } from '@packages/frontend-shared/src/graphql/testUrqlClient'
import { Component, computed, defineComponent, h } from 'vue'

import { ClientTestContext } from '../../src/graphql/ClientTestContext'
import type { TestSourceTypeLookup } from '@packages/graphql/src/testing/testUnionType'
import { createI18n } from '@packages/launchpad/src/locales/i18n'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
;(window as any).ipc = {
  on: () => {},
  send: () => {},
}

Cypress.Commands.add(
  'mount',
  <C extends Parameters<typeof mount>[0]>(comp: C, options: CyMountOptions<C> = {}) => {
    const context = new ClientTestContext({
      config: {},
      cwd: '/dev/null',
      // @ts-ignore
      browser: null,
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
    options.global.plugins.push(createI18n())
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
    project: '/dev/null',
    projectRoot: '/dev/null',
    invokedFromCli: true,
    testingType: 'e2e',
    os: 'darwin',
    _: [''],
  }, {})

  return mount(defineComponent({
    name: `mountFragment`,
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

      return {
        gql: computed(() => result.data.value?.[fieldName]),
      }
    },
    render: (props) => {
      return props.gql ? options.render(props.gql) : h('div')
    },
  }), {
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
              rootValue: options.type(context),
            }))
          },
        },
      ],
    },
  }).then(() => context)
}

function mountFragmentList<Result, Variables, T extends TypedDocumentNode<Result, Variables>> (source: T[], options: MountFragmentConfig<T>): Cypress.Chainable<ClientTestContext> {
  const context = new ClientTestContext({
    config: {},
    cwd: '/dev/null',
    // @ts-ignore
    browser: null,
    project: '/dev/null',
    projectRoot: '/dev/null',
    invokedFromCli: true,
    testingType: 'e2e',
    os: 'darwin',
    _: [''],
  }, {})

  return mount(defineComponent({
    name: `mountFragmentList`,
    setup () {
      const getTypeCondition = (source: any) => (source.definitions[0] as any).typeCondition.name.value.toLowerCase()
      const frags = source.map((src) => {
        /**
         * generates something like
         * wizard {
         *    ... MyFragment
         * }
         *
         * for each fragment passed in.
         */
        const parent = getTypeCondition(src)

        return `${parent} {
          ...${(src.definitions[0] as FragmentDefinitionNode).name.value}
        }`
      })

      const query = `
        query MountFragmentTest {
          ${frags.join('\n')}
        }

        ${source.map(print)}
      `

      const result = useQuery({
        query,
      })

      return {
        gql: computed(() => result.data.value),
      }
    },
    render: (props) => {
      return props.gql ? options.render(props.gql) : h('div')
    },
  }), {
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
              rootValue: options.type(context),
            }))
          },
        },
      ],
    },
  }).then(() => context)
}

Cypress.Commands.add('mountFragment', mountFragment)

Cypress.Commands.add('mountFragmentList', mountFragmentList)

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
} & CyMountOptions<unknown>

type MountFragmentListConfig<T extends TypedDocumentNode> = {
  variables?: T['__variablesType']
  render: (frag: Exclude<T['__resultType'], undefined>) => JSX.Element
  type: (ctx: ClientTestContext) => GetRootType<T>[]
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
        fragment: T[],
        config: MountFragmentListConfig<T>
      ): Cypress.Chainable<ClientTestContext>
    }
  }
}
