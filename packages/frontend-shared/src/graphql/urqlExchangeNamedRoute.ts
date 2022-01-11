import { Exchange, getOperationName } from '@urql/core'
import { map, pipe } from 'wonka'

export const namedRouteExchange: Exchange = ({ client, forward }) => {
  return (ops$) => {
    return forward(pipe(
      ops$,
      map((o) => {
        if (o.context.requestPolicy === 'cache-first' || o.context.requestPolicy === 'cache-only') {
          return o
        }

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
