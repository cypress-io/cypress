module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'stop .skip\'s in spec files',
      category: 'Spec Issues',
    },
    messages: {
      noOnly: `\
Found a {{test-scope}}.skip(...) without an explanation.
Add a comment above the '{{test-scope}}' e.g.

// NOTE: <reason test was skipped>
{{test-scope}}.skip(...)

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

        const hasExplain = commentBefore && commentBefore.map((v) => v.value.trim().startsWith('NOTE:')).filter(Boolean)[0]

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
