import axios from 'axios'
import { BaseContext } from '../../src'
import { startGraphQLServer, closeGraphQLServer, setServerContext } from '../../src/server'

/**
 * Creates a new GraphQL server to query during integration tests.
 * Also performsn any clean up from previous tests.
 * Optionally you may provide a context to orchestrate testing
 * specific scenarios or states.
 */
export const initGraphql = async (ctx: BaseContext) => {
  await closeGraphQLServer()
  if (ctx) {
    setServerContext(ctx)
  }

  return startGraphQLServer({ port: 51515 })
}

export const makeRequest = async (endpoint: string, query: string) => {
  const res = await axios.post(endpoint,
    JSON.stringify({
      query,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  return res.data.data
}
