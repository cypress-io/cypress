const commentTokens = ['NOTE:', 'TODO:']

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
${commentTokens.join('  ')}

e.g.
// TODO: <reason test was skipped>
{{test-scope}}.skip(⋯)

`,
    },

    // uncomment to enable autoFix
    // fixable: 'code',
  },

  create (context) {

    const sourceCode = context.getSourceCode()

    return {
      'CallExpression:exit' (node) {

        const callee = node.callee

        const commentBefore = sourceCode.getCommentsBefore(node)

        const hasExplain = commentBefore && commentBefore.map(
          (v) => commentTokens.map((commentToken) => v.value.trim().startsWith(commentToken)).filter(Boolean)[0]
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
