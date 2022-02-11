import { getOperationName } from '@urql/core'
import type { Exchange } from '@urql/core'

import { map, pipe } from 'wonka'

export const namedRouteExchange: Exchange = ({ client, forward }) => {
  return (ops$) => {
    return forward(pipe(
      ops$,
      map((o) => {
        // Only prefix the URL if it hasn't been already
        if (!o.context.url.endsWith('/graphql')) {
          return o
        }

        return {
          ...o,
          context: {
            ...o.context,
            url: `${o.context.url}/${o.kind}-${getOperationName(o.query)}`,
          },
        }
      }),
    ))
  }
}
