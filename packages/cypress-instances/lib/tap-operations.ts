import type { TapSpecsQuery } from './generated/graphql'

/**
 * A tap GraphQL operation paired with the result type generated from the same
 * document. `__result` is a phantom (never set at runtime) so a caller passing
 * the operation to a transport infers the response type with no manual type
 * argument, keeping the wire query and its type bound to one schema-validated
 * source.
 *
 * The `/* GraphQL *\/` magic comment lets graphql-codegen pluck and validate the
 * query against the schema; at runtime `query` is a plain string, so consumers
 * (the CLI included) send it over HTTP without pulling in a `graphql` runtime.
 */
export interface TapGraphqlOperation<TResult = unknown> {
  operationName: string
  query: string
  variables?: Record<string, unknown>
  __result?: TResult
}

export const TapSpecsOperation: TapGraphqlOperation<TapSpecsQuery> = {
  operationName: 'TapSpecs',
  query: /* GraphQL */ `
    query TapSpecs {
      currentProject {
        specs {
          relative
          gitInfo {
            lastModifiedHumanReadable
            lastModifiedTimestamp
          }
        }
      }
    }
  `,
}
