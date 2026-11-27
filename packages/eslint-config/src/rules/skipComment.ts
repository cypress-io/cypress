import type { Rule } from 'eslint'

const defaultCommentTokens = ['NOTE:', 'TODO:', 'FIXME:']

const testScopes = ['it', 'describe', 'context']

/**
 * Requires a comment explaining why a test block is skipped, so a `.skip` carries
 * its reason with it instead of going quiet.
 */
export const skipComment: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require an explanatory comment above a skipped test block',
    },
    messages: {
      missingExplanation: `Found a {{testScope}}.skip(⋯) without an explanation.
Add a comment above the '{{testScope}}' starting with one of:
{{commentTokens}}

e.g.
// {{exampleCommentToken}} <reason test was skipped>
{{testScope}}.skip(⋯)
`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          commentTokens: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create (context) {
    const commentTokens: string[] = context.options[0]?.commentTokens ?? defaultCommentTokens
    // `# NOTE:` shows up in Vue SFCs and shell-style comment blocks
    const acceptedPrefixes = commentTokens.flatMap((token) => [token, `# ${token}`])

    return {
      'CallExpression:exit' (node: Rule.Node) {
        if (node.type !== 'CallExpression') {
          return
        }

        const callee = node.callee

        if (
          callee.type !== 'MemberExpression'
          || callee.property.type !== 'Identifier'
          || callee.property.name !== 'skip'
          || callee.object.type !== 'Identifier'
          || !testScopes.includes(callee.object.name)
        ) {
          return
        }

        const hasExplanation = context.sourceCode.getCommentsBefore(node)
        .some((comment) => acceptedPrefixes.some((prefix) => comment.value.trim().startsWith(prefix)))

        if (hasExplanation) {
          return
        }

        context.report({
          node: callee.property,
          messageId: 'missingExplanation',
          data: {
            testScope: callee.object.name,
            commentTokens: commentTokens.join('  '),
            exampleCommentToken: commentTokens[0],
          },
        })
      },
    }
  },
}
