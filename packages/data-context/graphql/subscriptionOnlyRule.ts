import { GraphQLError } from 'graphql'
import type { ASTVisitor, ValidationContext } from 'graphql'

/**
 * Allows only subscription operations.
 */
export function subscriptionOnlyRule (context: ValidationContext): ASTVisitor {
  return {
    OperationDefinition (node) {
      if (node.operation === 'subscription') {
        return
      }

      context.reportError(new GraphQLError(`Only subscriptions are accepted on this endpoint, not ${node.operation} operations.`, node))
    },
  }
}
