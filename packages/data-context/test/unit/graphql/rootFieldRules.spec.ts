import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import express from 'express'
import fetch from 'cross-fetch'
import WebSocket from 'ws'
import { createServer } from 'http'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import path from 'path'
import { TypeInfo, parse, validate, visit, visitWithTypeInfo } from 'graphql'
import { loadDocuments } from '@graphql-tools/load'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'

import { clearCtx, setCtx } from '../../../src'
import type { DataContext } from '../../../src'
import { graphqlSchema } from '../../../graphql/schema'
import { RUNNER_MUTATIONS, TAP_MUTATIONS, TAP_QUERIES, runnerMutationRule, tapOperationRule } from '../../../graphql/rootFieldRules'
import { subscriptionOnlyRule } from '../../../graphql/subscriptionOnlyRule'
import { graphqlWS, handleGraphQLSocketRequest, handleRunnerGraphQLSocketRequest, tapGraphQLHTTP } from '../../../graphql/makeGraphQLServer'
import { createTestDataContext } from '../helper'

const DISALLOWED_MUTATION = 'mutation { openDirectoryInIDE(path: "/tmp") }'

const validateForRunner = (source: string) => {
  return validate(graphqlSchema, parse(source), [runnerMutationRule]).map((error) => error.message)
}

const packagesDir = path.join(__dirname, '..', '..', '..', '..')

/**
 * Root fields selected by the GraphQL documents in `pointers` (globs under
 * `packages/`), collected the way `allowRootFields` sees them, so fields
 * selected through fragments count too.
 */
async function collectSentRootFields (pointers: string[]) {
  const sources = await loadDocuments(pointers.map((pointer) => path.join(packagesDir, pointer)), { loaders: [new CodeFileLoader()] })
  const typeInfo = new TypeInfo(graphqlSchema)
  const sent = { query: new Set<string>(), mutation: new Set<string>(), subscription: new Set<string>() }
  const rootTypes = [
    ['query', graphqlSchema.getQueryType()],
    ['mutation', graphqlSchema.getMutationType()],
    ['subscription', graphqlSchema.getSubscriptionType()],
  ] as const

  for (const { document } of sources) {
    if (!document) {
      continue
    }

    visit(document, visitWithTypeInfo(typeInfo, {
      Field (node) {
        const kind = rootTypes.find(([, type]) => type && type === typeInfo.getParentType())?.[0]

        if (kind && !node.name.value.startsWith('__')) {
          sent[kind].add(node.name.value)
        }
      },
    }))
  }

  return {
    query: [...sent.query].sort(),
    mutation: [...sent.mutation].sort(),
    subscription: [...sent.subscription].sort(),
  }
}

describe('runnerMutationRule', () => {
  it('lists exactly the mutations the runner app sends', async () => {
    // Same documents as the `../app/src/generated/graphql.ts` target in graphql-codegen.yml.
    const { mutation } = await collectSentRootFields([
      'app/src/**/*.{vue,ts,tsx,js,jsx}',
      'frontend-shared/src/**/*.{vue,ts,tsx,js,jsx}',
    ])

    expect([...RUNNER_MUTATIONS].sort()).toEqual(mutation)
  }, 60_000)

  it('allows a mutation the runner sends', () => {
    expect(validateForRunner('mutation { openExternal(url: "https://on.cypress.io") }')).toEqual([])
  })

  it('rejects a mutation the runner does not send', () => {
    expect(validateForRunner(DISALLOWED_MUTATION)).toEqual(['The "openDirectoryInIDE" mutation is not available from the test runner.'])
  })

  it('rejects an aliased mutation', () => {
    expect(validateForRunner('mutation { openExternal: openDirectoryInIDE(path: "/tmp") }')).toHaveLength(1)
  })

  it('rejects a mutation selected through a fragment spread', () => {
    expect(validateForRunner('mutation { ...Switch } fragment Switch on Mutation { setCurrentProject(path: "/tmp") }')).toHaveLength(1)
  })

  it('rejects a mutation selected through an inline fragment', () => {
    expect(validateForRunner('mutation { ... on Mutation { addProject(path: "/tmp") } }')).toHaveLength(1)
  })

  it('allows __typename on the mutation root', () => {
    expect(validateForRunner('mutation { __typename }')).toEqual([])
  })

  it('does not restrict queries', () => {
    expect(validateForRunner('{ localSettings { preferences { preferredEditorBinary } } }')).toEqual([])
  })
})

const validateForTap = (source: string) => {
  return validate(graphqlSchema, parse(source), [tapOperationRule]).map((error) => error.message)
}

describe('tapOperationRule', () => {
  it('lists exactly the root fields `cypress tap` selects', async () => {
    const sent = await collectSentRootFields(['cypress-sessions/lib/tap-operations.ts'])

    expect({ query: [...TAP_QUERIES].sort(), mutation: [...TAP_MUTATIONS].sort(), subscription: [] }).toEqual(sent)
  })

  it('allows the query tap sends', () => {
    expect(validateForTap('{ currentProject { specs { relative } } }')).toEqual([])
  })

  it('allows the mutation tap sends', () => {
    expect(validateForTap('mutation { runSpec(specPath: "cypress/e2e/spec.cy.ts") { __typename } }')).toEqual([])
  })

  it('rejects a query tap does not send', () => {
    expect(validateForTap('{ localSettings { preferences { preferredEditorBinary } } }')).toEqual(['The "localSettings" query is not available from `cypress tap`.'])
  })

  it('rejects a mutation only the runner app sends', () => {
    expect(validateForTap('mutation { openExternal(url: "https://on.cypress.io") }')).toEqual(['The "openExternal" mutation is not available from `cypress tap`.'])
  })

  it('rejects a subscription', () => {
    expect(validateForTap('subscription { errorWarningChange { __typename } }')).toEqual(['The "errorWarningChange" subscription is not available from `cypress tap`.'])
  })

  it('allows __typename on the query root', () => {
    expect(validateForTap('{ __typename }')).toEqual([])
  })
})

describe('runner GraphQL transports', () => {
  let ctx: DataContext
  let openDirectoryInIDE: jest.SpiedFunction<typeof ctx.actions.project.openDirectoryInIDE>

  beforeAll(() => {
    ctx = createTestDataContext('open')
    setCtx(ctx)
  })

  afterAll(async () => {
    await clearCtx()
  })

  beforeEach(() => {
    openDirectoryInIDE = jest.spyOn(ctx.actions.project, 'openDirectoryInIDE').mockImplementation(() => {})
  })

  afterEach(() => {
    openDirectoryInIDE.mockRestore()
  })

  describe('socket', () => {
    const errorMessages = (callback: jest.Mock) => (callback.mock.calls[0][0] as { errors: Error[] }).errors.map((error) => error.message)

    it('rejects a disallowed mutation on the runner without running it', async () => {
      const callback = jest.fn()

      await handleRunnerGraphQLSocketRequest('gql1', JSON.stringify({ query: DISALLOWED_MUTATION }), callback)

      expect(errorMessages(callback)).toEqual(['The "openDirectoryInIDE" mutation is not available from the test runner.'])
      expect(openDirectoryInIDE).not.toHaveBeenCalled()
    })

    it('ignores extra arguments a client emits after the callback', async () => {
      const callback = jest.fn()

      await (handleRunnerGraphQLSocketRequest as (...args: unknown[]) => Promise<void>)('gql1', JSON.stringify({ query: DISALLOWED_MUTATION }), callback, [])

      expect(errorMessages(callback)).toHaveLength(1)
      expect(openDirectoryInIDE).not.toHaveBeenCalled()
    })

    it('rejects an operation that is invalid against the schema', async () => {
      const callback = jest.fn()

      await handleRunnerGraphQLSocketRequest('gql1', JSON.stringify({ query: '{ notAField }' }), callback)

      expect(errorMessages(callback)).toEqual(['Cannot query field "notAField" on type "Query".'])
    })

    it('replies with the error message when the payload is malformed', async () => {
      const callback = jest.fn()

      await handleRunnerGraphQLSocketRequest('gql1', '{', callback)

      const [{ errors: [error] }] = JSON.parse(JSON.stringify(callback.mock.calls[0]))

      expect(error.message).toEqual(expect.any(String))
    })

    it('replies with an error when validation overflows the stack', async () => {
      const callback = jest.fn()
      const fragments = Array.from({ length: 20_000 }, (_, i) => `fragment F${i} on Query { __typename ...F${i + 1} }`)
      const query = `{ ...F0 } ${fragments.join(' ')} fragment F20000 on Query { __typename }`

      await expect(handleRunnerGraphQLSocketRequest('gql1', JSON.stringify({ query }), callback)).resolves.toBeUndefined()

      expect(errorMessages(callback)).toEqual(['Maximum call stack size exceeded'])
    })

    it('runs an operation the runner sends', async () => {
      const callback = jest.fn()

      await handleRunnerGraphQLSocketRequest('gql1', JSON.stringify({ query: '{ __typename }' }), callback)

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: { __typename: 'Query' } }))
    })

    it('ignores an emit without an acknowledgement instead of rejecting', async () => {
      const emit = (handler: typeof handleGraphQLSocketRequest) => (handler as (...args: unknown[]) => Promise<void>)('gql1', JSON.stringify({ query: '{ __typename }' }))

      await expect(emit(handleRunnerGraphQLSocketRequest)).resolves.toBeUndefined()
      await expect(emit(handleGraphQLSocketRequest)).resolves.toBeUndefined()
    })

    it('does not restrict the launchpad handler', async () => {
      const callback = jest.fn()

      await handleGraphQLSocketRequest('gql1', JSON.stringify({ query: DISALLOWED_MUTATION }), callback)

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: { openDirectoryInIDE: true } }))
      expect(openDirectoryInIDE).toHaveBeenCalledWith('/tmp')
    })
  })

  describe('tap HTTP', () => {
    let server: Server
    let url: string

    beforeAll(async () => {
      server = express().use('/__cypress/tap/graphql/*', tapGraphQLHTTP).listen(0, '127.0.0.1')
      await new Promise((resolve) => server.once('listening', resolve))
      url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/__cypress/tap/graphql/op`
    })

    afterAll(async () => {
      await new Promise((resolve) => server.close(resolve))
    })

    const post = (query: string) => {
      return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) })
    }

    it('rejects a disallowed mutation without running it', async () => {
      const res = await post(DISALLOWED_MUTATION)

      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ errors: [expect.objectContaining({ message: 'The "openDirectoryInIDE" mutation is not available from `cypress tap`.' })] })
      expect(openDirectoryInIDE).not.toHaveBeenCalled()
    })

    it('rejects a query tap does not send', async () => {
      const res = await post('{ localSettings { preferences { preferredEditorBinary } } }')

      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ errors: [expect.objectContaining({ message: 'The "localSettings" query is not available from `cypress tap`.' })] })
    })

    it('runs a query', async () => {
      const res = await post('{ __typename }')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ data: { __typename: 'Query' } })
    })
  })

  describe('graphql-ws', () => {
    let server: Server
    let dispose: () => Promise<void>
    let port: number

    beforeAll(async () => {
      server = createServer()
      dispose = graphqlWS(server, '/__socket-graphql', { enforceOrigin: false, validationRules: [runnerMutationRule, subscriptionOnlyRule] }).dispose
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      port = (server.address() as AddressInfo).port
    })

    afterAll(async () => {
      await dispose()
      await new Promise((resolve) => server.close(resolve))
    })

    // Resolves with the first `next` or `error` message for the operation.
    const subscribe = (query: string): Promise<{ type: string, payload: any }> => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/__socket-graphql`, 'graphql-transport-ws')

        ws.once('open', () => ws.send(JSON.stringify({ type: 'connection_init' })))
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'connection_ack') {
            ws.send(JSON.stringify({ id: '1', type: 'subscribe', payload: { query } }))
          } else if (message.type === 'next' || message.type === 'error') {
            ws.close()
            resolve(message)
          }
        })

        ws.once('error', reject)
        ws.once('close', (code, reason) => reject(new Error(`graphql-ws closed with ${code}: ${reason}`)))
      })
    }

    const errorMessages = (message: { payload: { message: string }[] }) => message.payload.map((error) => error.message)

    it('rejects a disallowed mutation without running it', async () => {
      const message = await subscribe(DISALLOWED_MUTATION)

      expect(message.type).toBe('error')
      expect(errorMessages(message)).toEqual([
        'Only subscriptions are accepted on this endpoint, not mutation operations.',
        'The "openDirectoryInIDE" mutation is not available from the test runner.',
      ])

      expect(openDirectoryInIDE).not.toHaveBeenCalled()
    })

    it('rejects a mutation the runner sends over the socket', async () => {
      const message = await subscribe('mutation { setPromptShown(slug: "ci1") }')

      expect(message.type).toBe('error')
      expect(errorMessages(message)).toEqual(['Only subscriptions are accepted on this endpoint, not mutation operations.'])
    })

    it('rejects a query', async () => {
      const message = await subscribe('{ __typename }')

      expect(message.type).toBe('error')
      expect(errorMessages(message)).toEqual(['Only subscriptions are accepted on this endpoint, not query operations.'])
    })

    it('runs a subscription', async () => {
      const message = await subscribe('subscription { errorWarningChange { __typename } }')

      expect(message).toEqual(expect.objectContaining({ type: 'next', payload: { data: { errorWarningChange: { __typename: 'Query' } } } }))
    })
  })
})
