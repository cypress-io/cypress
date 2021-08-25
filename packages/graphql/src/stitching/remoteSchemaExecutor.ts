import type { Executor } from '@graphql-tools/utils/executor'
import { print } from 'graphql'
import fetch from 'cross-fetch'
import type { BaseContext } from '../context/BaseContext'

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor: Executor<BaseContext> = async ({ document, variables, context }) => {
  if (!context?.authenticatedUser) {
    return { data: null }
  }

  const query = print(document)

  // TODO(tim): remove / change to debug
  // eslint-disable-next-line
  console.log(`Executing query ${query} against remote`)

  const fetchResult = await fetch('http://localhost:3000/test-runner-graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${context?.authenticatedUser.authToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  return fetchResult.json()
}
