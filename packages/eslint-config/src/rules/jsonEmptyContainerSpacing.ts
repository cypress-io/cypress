import type { Rule } from 'eslint'
import type { AST } from 'jsonc-eslint-parser'

type EmptyContainer = AST.JSONObjectExpression | AST.JSONArrayExpression

/**
 * Collapses `{ }` and `[ ]` to `{}` and `[]`, the form `JSON.stringify` emits.
 * `jsonc/object-curly-spacing` and `jsonc/array-bracket-spacing` skip empty
 * containers, so neither catches the padding.
 */
export const jsonEmptyContainerSpacing: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description: 'Disallow whitespace inside empty JSON objects and arrays',
    },
    messages: {
      padded: 'Expected `{{collapsed}}` with no whitespace inside.',
    },
    schema: [],
  },
  create (context) {
    const { sourceCode } = context

    const check = (node: EmptyContainer, isEmpty: boolean, collapsed: string) => {
      // Safe because jsonc-eslint-parser emits ESTree-compatible ranges and
      // locations, which is all the SourceCode methods below read.
      const estreeNode = node as unknown as Rule.Node

      if (!isEmpty || sourceCode.getText(estreeNode) === collapsed) {
        return
      }

      // A comment makes it JSONC, and collapsing would delete the comment
      if (sourceCode.getCommentsInside(estreeNode).length) {
        return
      }

      context.report({
        node: estreeNode,
        messageId: 'padded',
        data: { collapsed },
        fix: (fixer) => fixer.replaceText(estreeNode, collapsed),
      })
    }

    return {
      JSONObjectExpression: (node: AST.JSONObjectExpression) => check(node, node.properties.length === 0, '{}'),
      JSONArrayExpression: (node: AST.JSONArrayExpression) => check(node, node.elements.length === 0, '[]'),
    }
  },
}
