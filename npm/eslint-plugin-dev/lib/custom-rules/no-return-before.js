const defaultTokens = ['it', 'describe', 'context', 'expect']
// const debug = require('debug')('@cypress/dev')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce no return before certain token names',
      category: 'Misc',
    },
    messages: {
      errorMessage: `\
Found a 'return' after '{{token}}'\
`,
    },

    schema: [
      {
        type: 'object',
        properties: {
          tokens: {
            type: 'array',
            default: defaultTokens,
          },
        },
        additionalProperties: false,
      },
    ],
    // uncomment to enable autoFix
    fixable: 'code',

  },

  create (context) {
    let tokens = defaultTokens

    if (context.options.length) {
      tokens = typeof context.options[0].tokens === 'object' ? context.options[0].tokens : tokens
    }

    return {
      'CallExpression:exit' (node) {
        const callee = node.callee

        if (
          (callee.type === 'Identifier')
          && tokens.includes(callee.name)
        ) {
          const t = context.getSourceCode().getTokenBefore(node)

          // debug(t)

          if (!(t && t.type === 'Keyword' && t.value === 'return')) return

          const returnNode = t

          context.report({
            node: callee,
            loc: callee.loc.start,
            messageId: 'errorMessage',
            data: {
              token: callee.name,
            },
            // uncomment to enable autoFix
            fix (fixer) {
              return fixer.replaceTextRange([returnNode.range[0], returnNode.range[1] + 1], '')
            },
          })
        }
      },
    }
  },
}
