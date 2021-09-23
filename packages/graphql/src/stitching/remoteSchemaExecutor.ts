import type { Executor } from '@graphql-tools/utils/executor'
import { print } from 'graphql'
import fetch from 'cross-fetch'
import getenv from 'getenv'

import type { DataContext } from '@packages/data-context'

const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV) as keyof typeof REMOTE_SCHEMA_URLS
const REMOTE_SCHEMA_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://dashboard-staging.cypress.io',
  production: 'https://dashboard.cypress.io',
}

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor: Executor<DataContext> = async ({ document, variables, context }) => {
  if (!context?.user) {
    return { data: null }
  }

  const query = print(document)

  // TODO(tim): remove / change to debug
  // eslint-disable-next-line
  // console.log(`Executing query ${query} against remote`)

  const fetchResult = await fetch(`${REMOTE_SCHEMA_URLS[cloudEnv]}/test-runner-graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${context?.user.authToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  return fetchResult.json()
}
