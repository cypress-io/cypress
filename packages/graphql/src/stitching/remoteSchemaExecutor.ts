import type { SubschemaConfig } from '@graphql-tools/delegate'
import { print } from 'graphql'
import fetch from 'cross-fetch'

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor: Exclude<SubschemaConfig['executor'], undefined> = async ({ document, variables }) => {
  const query = print(document)

  // eslint-disable-next-line
  console.log(`Executing query ${query} against remote`)

  const fetchResult = await fetch('http://localhost:3000/tr-graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  return fetchResult.json()
}
