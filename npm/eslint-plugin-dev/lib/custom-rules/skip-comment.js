const defaultCommentTokens = ['NOTE:', 'TODO:', 'FIXME:']

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'stop .skip\'s in spec files',
      category: 'Spec Issues',
    },
    messages: {
      noOnly: `\
Found a {{test-scope}}.skip(⋯) without an explanation.
Add a comment above the '{{test-scope}}' starting with one of:
{{commentTokens}}

e.g.
// {{exampleCommentToken}} <reason test was skipped>
{{test-scope}}.skip(⋯)

`,
    },

    schema: [
      {
        type: 'object',
        properties: {
          commentTokens: {
            type: 'array',
            default: defaultCommentTokens,
          },
        },
        additionalProperties: false,
      },
    ],
    // uncomment to enable autoFix
    // fixable: 'code',

  },

  create (context) {
    let commentTokens = defaultCommentTokens

    if (context.options.length) {
      commentTokens = typeof context.options[0].commentTokens === 'object' ? context.options[0].commentTokens : commentTokens
    }

    const sourceCode = context.getSourceCode()

    return {
      'CallExpression:exit' (node) {
        const callee = node.callee

        const commentBefore = sourceCode.getCommentsBefore(node)

        const hasExplain = commentBefore && commentBefore.map(
          (v) => commentTokens.concat(commentTokens.map((v) => `# ${v}`)).map((commentToken) => v.value.trim().startsWith(commentToken)).filter(Boolean)[0],
        ).filter(Boolean)[0]

        if (hasExplain) {
          return
        }

        if (node.type === 'CallExpression' && callee.type === 'MemberExpression' && callee.property.name === 'skip') {
          if (['it', 'describe', 'context'].includes(callee.object.name)) {
            context.report({
              node: callee.property,
              loc: callee.property.loc.start,
              messageId: 'noOnly',
              data: {
                'test-scope': callee.object.name,
                commentTokens: commentTokens.join('  '),
                exampleCommentToken: commentTokens[0],
              },
              // uncomment to enable autoFix
              // fix(fixer) {
              //   return fixer.replaceTextRange([callee.property.start - 1, callee.property.end], '')
              // }
            })
          }
        }
      },
    }
  },
}
