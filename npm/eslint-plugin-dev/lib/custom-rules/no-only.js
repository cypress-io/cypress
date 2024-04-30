// @see https://github.com/eslint/eslint/blob/v8.57.0/lib/shared/ast-utils.js#L12
// This value is not exported anywhere, but hasn't changed in almost a decade.
// we can directly reference the pattern here
const lineBreakPattern = /\r\n|[\r\n\u2028\u2029]/u

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'stop .only\'s in spec files',
      category: 'Spec Issues',
    },
    messages: {
      noOnly: 'Found only: `{{callee}}`.',
    },

    // uncomment to enable autoFix
    // fixable: 'code',
  },

  create (context) {
    const sourceCode = context.getSourceCode()

    function getPropertyText (node) {
      const lines = sourceCode.getText(node).split(lineBreakPattern)

      return lines[0]
    }

    return {
      'CallExpression:exit' (node) {
        const callee = node.callee

        if (node.type === 'CallExpression' && callee.type === 'MemberExpression' && callee.property.name === 'only') {
          if (['it', 'describe', 'context'].includes(callee.object.name)) {
            context.report({
              node: callee.property,
              loc: callee.property.loc.start,
              messageId: 'noOnly',
              data: {
                callee: getPropertyText(callee.parent),
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
